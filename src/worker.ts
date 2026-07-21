import { handle } from '@astrojs/cloudflare/handler';
import { refreshPyPIStats } from '@/lib/server/pypi-stats';

export default {
	fetch(request, env, context) {
		return handle(request, env, context);
	},
	async scheduled(_controller, env) {
		await refreshPyPIStats(env.PACKAGE_STATS);
	}
} satisfies ExportedHandler<Env>;
