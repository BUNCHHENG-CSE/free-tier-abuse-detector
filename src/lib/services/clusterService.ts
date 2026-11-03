import { db, initDatabase } from '../db/database';
import { prisma } from '../db/prisma';

export interface ClusterNode {
  id: string;
  label: string;
  type: 'fingerprint' | 'account' | 'ip';
  riskScore?: number;
  status?: string;
  count?: number;
  isBanned?: boolean;
}

export interface ClusterLink {
  source: string;
  target: string;
  type: 'LINKED_TO' | 'CONNECTED_VIA' | 'ALIAS_OF';
}

export interface ClusterGraph {
  nodes: ClusterNode[];
  links: ClusterLink[];
  stats: {
    totalClusters: number;
    multiAccountDevices: number;
    totalAccountsInClusters: number;
  };
}

export async function getClusterGraph(appId: string): Promise<ClusterGraph> {
  await initDatabase();
  const nodesMap = new Map<string, ClusterNode>();
  const links: ClusterLink[] = [];

  if (db.isPostgres) {
    const fps = await prisma.fingerprint.findMany({
      where: { appId },
      orderBy: [{ linkedAccountsCount: 'desc' }, { totalEvents: 'desc' }],
      take: 30,
      select: {
        id: true,
        totalEvents: true,
        linkedAccountsCount: true,
        primaryIp: true,
        isBanned: true,
      },
    });

    const fpIds = fps.map((f) => f.id);

    const allAccounts =
      fpIds.length > 0
        ? await prisma.account.findMany({
            where: {
              appId,
              fingerprintId: { in: fpIds },
            },
            orderBy: { firstSeenAt: 'desc' },
            select: {
              id: true,
              email: true,
              status: true,
              ipAddress: true,
              fingerprintId: true,
            },
          })
        : [];

    const accountsByFp = new Map<string, typeof allAccounts>();
    for (const acc of allAccounts) {
      const list = accountsByFp.get(acc.fingerprintId) || [];
      if (list.length < 15) {
        list.push(acc);
        accountsByFp.set(acc.fingerprintId, list);
      }
    }

    let multiAccountDevices = 0;
    let totalAccountsInClusters = 0;

    for (const fp of fps) {
      if (fp.linkedAccountsCount > 1) {
        multiAccountDevices++;
      }

      const shortId = `${fp.id.slice(0, 11)}...`;
      nodesMap.set(fp.id, {
        id: fp.id,
        label: `Device ${shortId}`,
        type: 'fingerprint',
        count: fp.linkedAccountsCount,
        isBanned: fp.isBanned === 1,
      });

      if (fp.primaryIp) {
        const ipNodeId = `ip_${fp.primaryIp}`;
        if (!nodesMap.has(ipNodeId)) {
          nodesMap.set(ipNodeId, {
            id: ipNodeId,
            label: `IP: ${fp.primaryIp}`,
            type: 'ip',
          });
        }

        links.push({
          source: fp.id,
          target: ipNodeId,
          type: 'CONNECTED_VIA',
        });
      }

      const accounts = accountsByFp.get(fp.id) || [];
      totalAccountsInClusters += accounts.length;

      accounts.forEach((acc) => {
        const accNodeId = `acc_${acc.email}`;
        if (!nodesMap.has(accNodeId)) {
          nodesMap.set(accNodeId, {
            id: accNodeId,
            label: acc.email,
            type: 'account',
            status: acc.status || undefined,
          });
        }

        links.push({
          source: accNodeId,
          target: fp.id,
          type: 'LINKED_TO',
        });
      });
    }

    return {
      nodes: Array.from(nodesMap.values()),
      links,
      stats: {
        totalClusters: fps.length,
        multiAccountDevices,
        totalAccountsInClusters,
      },
    };
  }

  // Fallback path for local SQLite
  const fps = await db.query<{
    id: string;
    total_events: number;
    linked_accounts_count: number;
    primary_ip: string;
    is_banned: number;
  }>(
    `SELECT id, total_events, linked_accounts_count, primary_ip, is_banned
     FROM fingerprints
     WHERE app_id = $1
     ORDER BY linked_accounts_count DESC, total_events DESC
     LIMIT 30`,
    [appId]
  );

  let multiAccountDevices = 0;
  let totalAccountsInClusters = 0;

  for (const fp of fps) {
    if (fp.linked_accounts_count > 1) {
      multiAccountDevices++;
    }

    const shortId = `${fp.id.slice(0, 11)}...`;
    nodesMap.set(fp.id, {
      id: fp.id,
      label: `Device ${shortId}`,
      type: 'fingerprint',
      count: Number(fp.linked_accounts_count),
      isBanned: Number(fp.is_banned) === 1,
    });

    if (fp.primary_ip) {
      const ipNodeId = `ip_${fp.primary_ip}`;
      if (!nodesMap.has(ipNodeId)) {
        nodesMap.set(ipNodeId, {
          id: ipNodeId,
          label: `IP: ${fp.primary_ip}`,
          type: 'ip',
        });
      }

      links.push({
        source: fp.id,
        target: ipNodeId,
        type: 'CONNECTED_VIA',
      });
    }

    const accounts = await db.query<{ id: string; email: string; status: string; ip_address: string }>(
      `SELECT id, email, status, ip_address FROM accounts
       WHERE app_id = $1 AND fingerprint_id = $2
       ORDER BY first_seen_at DESC
       LIMIT 15`,
      [appId, fp.id]
    );

    totalAccountsInClusters += accounts.length;

    accounts.forEach((acc) => {
      const accNodeId = `acc_${acc.email}`;
      if (!nodesMap.has(accNodeId)) {
        nodesMap.set(accNodeId, {
          id: accNodeId,
          label: acc.email,
          type: 'account',
          status: acc.status,
        });
      }

      links.push({
        source: accNodeId,
        target: fp.id,
        type: 'LINKED_TO',
      });
    });
  }

  return {
    nodes: Array.from(nodesMap.values()),
    links,
    stats: {
      totalClusters: fps.length,
      multiAccountDevices,
      totalAccountsInClusters,
    },
  };
}
