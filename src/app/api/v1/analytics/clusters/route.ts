import { getClusterGraph } from '@/lib/services/clusterService';
import { resolveAppId, json, error } from '@/lib/server/apiHelper';
import { initDatabase } from '@/lib/db/database';

export async function GET(req: Request) {
  try {
    await initDatabase();
    const appId = await resolveAppId(req);
    const graph = await getClusterGraph(appId);
    return json(graph);
  } catch (err: any) {
    return error(err.message, 500);
  }
}
