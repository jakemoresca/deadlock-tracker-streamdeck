import streamDeck, { LogLevel } from "@elgato/streamdeck";

// import { IncrementCounter } from "./actions/increment-counter";
import { LeaderboardStats } from "./actions/leaderboard-stats";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel(LogLevel.DEBUG);

// Register the increment action.
streamDeck.actions.registerAction(new LeaderboardStats());

streamDeck.logger.info('Deadlock Tracker plugin started');

// Finally, connect to the Stream Deck.
streamDeck.connect();