import streamDeck, { action, SingletonAction, KeyAction, WillAppearEvent, KeyUpEvent, WillDisappearEvent } from "@elgato/streamdeck";

const ONE_MINUTE = 60 * 1000;
const FIVE_MINUTES = 5 * ONE_MINUTE;
const FIFTEEN_MINUTES = 15 * ONE_MINUTE;

@action({ UUID: "com.ryder.deadlocktracker.leaderboardstats" })
export class LeaderboardStats extends SingletonAction<LeaderboardStatsSettings> {
	private timer: NodeJS.Timeout | undefined;

	override async onWillAppear(ev: WillAppearEvent<LeaderboardStatsSettings>) {
		await ev.action.setTitle('Loading...');

		streamDeck.logger.info('LeaderboardStats onWillAppear triggered.');
		if (!ev.action.isKey()) return;

		await this.getLeaderboardStats(ev.action);

		if (!this.timer) {
			this.timer = setInterval(async () => {
				for (const action of this.actions) {
					if (action.isKey()) {
						streamDeck.logger.info('Refreshing stats');
						await this.getLeaderboardStats(action);
					}
				}
			}, FIVE_MINUTES);
		}
	}

	override async onKeyUp(ev: KeyUpEvent<LeaderboardStatsSettings>): Promise<void> {
		streamDeck.logger.info('LeaderboardStats onKeyUp triggered.', ev.toString());
		await this.getLeaderboardStats(ev.action);
	}

	override async onWillDisappear(ev: WillDisappearEvent<LeaderboardStatsSettings>): Promise<void> {
		if (this.actions.next().done) {
			clearInterval(this.timer);
			this.timer = undefined;
		}
	}

	private async getLeaderboardStats(action: KeyAction<LeaderboardStatsSettings>) {
		try {
			streamDeck.logger.info('getting LeaderboardStats');
			const settings = await action.getSettings<LeaderboardStatsSettings>();
			const baseUrl = `https://data.deadlock-api.com/v1/commands/${settings.region}/${settings.steamAccountId}/resolve?template=%7B+%22total_win%22%3A+%7Btotal_wins%7D%2C+%22total_kills%22%3A+%7Btotal_kills%7D%2C+%22total_losses%22%3A+%7Btotal_losses%7D%2C+%22total_winrate%22%3A+%22%7Btotal_winrate%7D%22%2C+%22wins_losses_today%22%3A+%22%7Bwins_losses_today%7D%22%2C+%22leaderboard_rank%22%3A+%22%7Bleaderboard_rank%7D%22%2C+%22leaderboard_place%22%3A+%22%7Bleaderboard_place%7D%22%2C+%22most_played_hero%22%3A+%22%7Bmost_played_hero%7D%22+%7D`;
			
			streamDeck.logger.debug('url: ', baseUrl);
			const response = await fetch(baseUrl);

			if (!response.ok) {
				throw new Error('Failed to fetch Deadlock stat: ' + response.statusText);
			}
			
			const statResponseJson = await response.json() as LeaderboardStatsResponse;
			const leaderboardStatKey = settings.leaderboardStat as keyof LeaderboardStatsResponse;
			const leaderboardStatValue = statResponseJson[leaderboardStatKey] as string;

			streamDeck.logger.debug(`got stat value for ${leaderboardStatKey}: ${leaderboardStatValue}`);

			await action.setTitle(leaderboardStatValue?.toString() || 'Error');
		} catch (e) {
			streamDeck.logger.error('Failed to fetch Deadlock stat:', e);
		}
	} 
}

type LeaderboardStatsSettings = {
	steamAccountId?: number;
	region?: string;
	leaderboardStat?: string;
	autoUpdate?: boolean;
};

type LeaderboardStatsResponse = {
	total_win: number;
	total_kills: number;
	total_losses: number;
	total_winrate: string;
	wins_losses_today: string;
	leaderboard_rank: string;
	leaderboard_place: string;
	most_played_hero: string;
}