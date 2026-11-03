import { NextRequest, NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db/database';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

const APP_ID = 'app_demo_default';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await initDatabase();
    const { id: fpId } = await context.params;
    const { isBanned = true } = await req.json();

    if (db.isPostgres) {
      await prisma.$transaction(async (tx) => {
        await tx.fingerprint.update({
          where: { id_appId: { id: fpId, appId: APP_ID } },
          data: {
            isBanned: isBanned ? 1 : 0,
            tags: isBanned ? 'banned' : 'active',
          },
        });

        if (isBanned) {
          await tx.account.updateMany({
            where: { fingerprintId: fpId, appId: APP_ID },
            data: { status: 'banned' },
          });
        }
      });

      return NextResponse.json({ success: true, fingerprintId: fpId, isBanned });
    }

    await db.execute(
      `UPDATE fingerprints
       SET is_banned = $1, tags = $2
       WHERE id = $3 AND app_id = $4`,
      [isBanned ? 1 : 0, isBanned ? 'banned' : 'active', fpId, APP_ID]
    );

    if (isBanned) {
      await db.execute(
        `UPDATE accounts
         SET status = 'banned'
         WHERE fingerprint_id = $1 AND app_id = $2`,
        [fpId, APP_ID]
      );
    }

    return NextResponse.json({ success: true, fingerprintId: fpId, isBanned });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
