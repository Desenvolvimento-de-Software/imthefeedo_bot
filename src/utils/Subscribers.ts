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

import { PrismaClient, chats, feeds, feeds_subscribers } from "@prisma/client";
import { getFeedItems } from "utils/Feeds";
import Log from "helpers/Log";

const prisma = new PrismaClient();

/**
 * Returns whether the chat is subscribed to the feed.
 *
 * @author Marcos Leandro
 * @since  2025-04-02
 *
 * @param chatId
 * @param feedId
 *
 * @return true if the chat is subscribed to the feed, false otherwise.
 */
export const isChatSubscribed = async (chatId: number, feedId: number): Promise<boolean> => {

    return prisma.feeds_subscribers.findFirst({
        where: {
            chat_id: chatId,
            feed_id: feedId,
            status: true
        }

    }).then((subscriber: feeds_subscribers | null) => {
        return !!subscriber;

    }).catch(() => {
        return false;

    }).finally(() => {
        prisma.$disconnect();
    });
};

/**
 * Returns the subscriptions of the chat.
 *
 * @author Marcos Leandro
 * @since  2025-04-02
 *
 * @param chatId
 *
 * @return the subscriptions of the chat.
 */
export const getSubscriptions = async (chatId: number): Promise<Record<string, any>[]> => {

    return await prisma.feeds_subscribers.findMany({
        where: {
            chat_id: chatId,
            status: true
        },
        include: {
            feeds: true
        }

    }).catch((err) => {
        Log.save(err.message, err.stack);
        return [];

    }).finally(() => {
        prisma.$disconnect();
    });
};

export const getSubscriptionByUrl = async (chatId: number, url: string): Promise<Record<string, any> | null> => {
    return await prisma.feeds_subscribers.findFirst({
        where: {
            chat_id: chatId,
            feeds: {
                link: url
            }
        }

    }).catch((err) => {
        Log.save(err.message, err.stack);
        return [];

    }).finally(() => {
        prisma.$disconnect();
    });
}

/**
 * Returns the subscribers of the feed.
 *
 * @author Marcos Leandro
 * @since  2025-04-02
 *
 * @param feed
 *
 * @return the subscribers of the feed.
 */
export const getSubscribers = async (feed: Record<string, any>): Promise<feeds_subscribers[]> => {

    return await prisma.feeds_subscribers.findMany({
        where: {
            feed_id: feed.id,
            status: true
        }

    }).catch((err) => {
        Log.save(err.message, err.stack);
        return [];

    }).finally(() => {
        prisma.$disconnect();
    });
};

/**
 * Adds a subscriber to the feed.
 *
 * @author Marcos Leandro
 * @since  2025-04-02
 *
 * @param chat
 * @param feed
 *
 * @return the subscriber.
 */
export const addSubscriber = async (chat: chats, feed: feeds): Promise<feeds_subscribers> => {

    const items = await getFeedItems(feed);

    return prisma.feeds_subscribers.upsert({
        where: {
            chat_id_feed_id: {
                feed_id: feed.id,
                chat_id: chat.id
            }
        },
        create: {
            chat_id: chat.id,
            feed_id: feed.id,
            last_notification_item_id: items[0].id ?? null,
            last_notification_date: Math.floor(new Date().getTime() / 1000),
            add_date: Math.floor(new Date().getTime() / 1000),
            status: true
        },
        update: {
            last_notification_item_id: items[0].id ?? null,
            last_notification_date: Math.floor(new Date().getTime() / 1000),
            update_date: Math.floor(new Date().getTime() / 1000),
            status: true
        }
    }).then((subscriber: feeds_subscribers) => {
        return subscriber;

    }).catch((e: any) => {
        Log.save(e.message, e.stack);
        throw new Error("Subscriber not found");

    }).finally(() => {
        prisma.$disconnect();
    });
}
