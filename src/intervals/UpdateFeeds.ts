/**
 * Ada Lovelace Telegram Bot
 *
 * This file is part of Ada Lovelace Telegram Bot.
 * You are free to modify and share this project or its files.
 *
 * @package  mslovelace_bot
 * @author   Marcos Leandro <mleandrojr@yggdrasill.com.br>
 * @license  GPLv3 <http://www.gnu.org/licenses/gpl-3.0.en.html>
 */

import { feeds } from "@prisma/client";
import { getFeedDataByLink, getActiveFeeds, populateFeed } from "utils/Feeds";
import Iinterval from "interfaces/Iinterval";
import Log from "helpers/Log";

export default class UpdateFeeds implements Iinterval {

    /**
     * Current interval.
     *
     * @author Marcos Leandro
     * @since  2025-02-25
     */
    private interval: NodeJS.Timeout | null = null;

    /**
     * The constructor.
     *
     * @author Marcos Leandro
     * @since  2023-06-07
     */
    public constructor() {

        const run = () => {
            this.run();
        };

        run();
    }

    /**
     * Destroys the interval.
     *
     * @author Marcos Leandro
     * @since  2025-02-25
     */
    public destroy(): void {
        if (this.interval) {
            clearTimeout(this.interval);
        }
    }

    /**
     * Interval routines.
     *
     * @author Marcos Leandro
     * @since  2025-02-25
     */
    private readonly run = async (): Promise<void> => {
        this.interval = setTimeout(this.run, 1 * 60 * 1000); // 1 minute
        Log.save(`[${this.interval}] Updating feeds...`);
        const feeds = await getActiveFeeds();
        for (const feed of feeds) {
            this.updateFeed(feed);
        }
    }

    /**
     * Populates the feed with the data.
     *
     * @author Marcos Leandro
     * @since  2025-02-25
     *
     * @param feed
     * @param feedData
     */
    private async updateFeed(feed: feeds): Promise<void> {
        getFeedDataByLink(feed.link).then(feedData => (
            populateFeed(feed, feedData.items)

        )).catch((error) => {
            Log.save(`Error updating feed ${feed.link}: ${error.message}`)
        });
    }
}
