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

import { getFeedDataByLink, getFeeds, populateFeed } from "utils/Feeds";
import { feeds } from "@prisma/client";
import Iinterval from "interfaces/Iinterval";
import Log from "helpers/Log";
import Parser from "rss-parser";

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

        Log.save("Updating feeds.");

        const feeds = await getFeeds();
        for (const feed of feeds) {
            this.updateFeed(feed);
        }

        this.interval = setTimeout(this.run, 5 * 60 * 1000); // 5 minutes
    }

        /**
     * populates the feed with the data.
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
        ));
    }
}
