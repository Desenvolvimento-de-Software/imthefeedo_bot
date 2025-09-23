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

import { feeds, feeds_items, PrismaClient } from "@prisma/client";
import { decode } from "html-entities";
import Log from "helpers/Log";
import Parser from "rss-parser";

const prisma = new PrismaClient();

/**
 * Returns the feeds.
 *
 * @author Marcos Leandro
 * @since  2025-04-02
 *
 * @return All the feeds.
 */
export const getFeeds = async (): Promise<feeds[]> => {

    try {

        const feeds = await prisma.feeds.findMany({
            orderBy: { id: "asc" }
        });

        return feeds;

    } catch (error: any) {
        Log.save(error.message, error.stack);
        return [];

    } finally {
        await prisma.$disconnect();
    }
};

/**
 * Returns the feeds with it's items.
 *
 * @author Marcos Leandro
 * @since  2025-04-02
 *
 * @return All the feeds with items.
 */
export const getFeedsWithItems = async (): Promise<Record<string, any>[]> => {

    try {

        const feeds = await prisma.feeds.findMany({
            include: {
                feeds_items: {
                    where: {
                        publish_date: {
                            gte: Math.floor((Date.now() - 1000 * 60 * 60 * 24) / 1000)
                        }
                    },
                    orderBy: { publish_date: "asc" }
                }
            },
            orderBy: { id: "asc" }
        });

        return feeds;

    } catch (error: any) {
        Log.save(error.message, error.stack);
        return [];

    } finally {
        await prisma.$disconnect();
    }
};

/**
 * Registers and returns the feed.
 *
 * @author Marcos Leandro
 * @since  2025-04-02
 *
 * @param link
 *
 * @returns
 */
export const createAndGetFeed = async (link: string): Promise<feeds> => {

    try {

        let feed = await getFeedByLink(link);
        if (!feed) {
            const feedData = await getFeedDataByLink(link);
            feed = await createFeed(link, feedData);
        }

        if (!feed) {
            throw new Error("Unable to create feed.");
        }

        return feed;

    } catch (error: any) {
        Log.save(error.message, error.stack);
        throw new Error(error.message);

    } finally {
        await prisma.$disconnect();
    }
};

/**
 * Returns the feed by link.
 *
 * @author Marcos Leandro
 * @since  2025-04-02
 *
 * @param link
 *
 * @return Promise<feeds | null>
 */
export const getFeedByLink = async (link: string): Promise<feeds|null> => {

    try {

        const feed = await prisma.feeds.findFirst({
            where: { link: link }
        });

        return feed;

    } catch (error: any) {
        Log.save(error.message, error.stack);
        throw new Error(error.message);

    } finally {
        await prisma.$disconnect();
    }
}

/**
 * Returns the feed data by link.
 *
 * @author Marcos Leandro
 * @since  2025-04-02
 *
 * @param link
 *
 * @return Promise<Parser.Output<Parser.Item>>
 */
export const getFeedDataByLink = async (link: string): Promise<Parser.Output<Parser.Item>> => {

    const parser = new Parser();
    return parser.parseURL(link).then((result: Parser.Output<Parser.Item>) => {
        return result;

    }).catch((err: any) => {
        Log.save(`Error parsing feed ${link}: ${err.message}`, err.stack);
    });
};

/**
 * Returns the feed items.
 *
 * @author Marcos Leandro
 * @since  2025-04-02
 *
 * @param feed
 */
export const getFeedItems = async (feed: feeds): Promise<feeds_items[]> => {

    try {

        const items = await prisma.feeds_items.findMany({
            where: { feed_id: feed.id },
            orderBy: { publish_date: "desc" }
        });

        return items;

    } catch (error: any) {
        Log.save(error.message, error.stack);
        throw new Error(error.message);

    } finally {
        await prisma.$disconnect();
    }
};

/**
 * Creates a new feed.
 *
 * @author Marcos Leandro
 * @since  2025-04-02
 *
 * @param feedData
 *
 * @returns Promise<feeds>
 */
export const createFeed = async (link: string, feedData: Parser.Output<Parser.Item>): Promise<feeds> => {

    try {

        const feed = await prisma.feeds.create({
            data: {
                title: feedData.title!,
                link: link,
                description: feedData.description ?? null,
                image: feedData.image?.url ?? null
            }
        });

        if (!feed) {
            throw new Error("Unable to create feed.");
        }

        await populateFeed(feed, feedData.items);
        return feed;

    } catch (error: any) {
        Log.save(error.message, error.stack);
        throw new Error(error.message);

    } finally {
        await prisma.$disconnect();
    }
};

/**
 * Populates the feed with existing items.
 *
 * @author Marcos Leandro
 * @since  2025-04-02
 *
 * @param feed
 * @param items
 */
export const populateFeed = async (feed: feeds, items: Parser.Item[]): Promise<void> => {

    const feedItems = items.reverse();
    for (const item of feedItems) {
        const publishDate = new Date(item.pubDate ?? item.isoDate ?? Date.now()).getTime();
        await prisma.feeds_items.upsert({
            where: {
                feed_id_link: {
                    feed_id: feed.id,
                    link: item.link!
                }
            },
            create: {
                feed_id: feed.id,
                title: decode(item.title!).trim(),
                link: decode(item.link!).trim(),
                description: decode(item.content ?? null),
                publish_date: Math.floor(publishDate / 1000)
            },
            update: {
                title: decode(item.title!).trim(),
                description: decode(item.content ?? null).trim(),
                publish_date: Math.floor(publishDate / 1000)
            }
        });
    }
};
