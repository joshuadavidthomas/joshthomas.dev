import { handle } from '@astrojs/cloudflare/handler';
import { refreshProjects } from '@/lib/server/projects-snapshot';
import { refreshPyPIStats } from '@/lib/server/pypi-stats';

export default {
	fetch(request, env, context) {
		return handle(request, env, context);
	},
	async scheduled(_controller, env) {
		// The projects refresh reads the PyPI snapshot, so it runs second and still runs when every
		// PyPI refresh fails, because the previous PyPI values are retained.
		let pypiError: unknown;
		try {
			await refreshPyPIStats(env.PACKAGE_STATS);
		} catch (error) {
			pypiError = error;
		}
		await refreshProjects(env.PACKAGE_STATS, env.GITHUB_TOKEN);
		if (pypiError) throw pypiError;
	}
} satisfies ExportedHandler<Cloudflare.Env>;
