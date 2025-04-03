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

import Chat from "contexts/Chat";
import { chats, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Returns a chat, creating it if it doesn't exist.
 *
 * @author Marcos Leandro
 * @since  2025-04-02
 *
 * @param chat
 *
 * @return Chat object.
 */
export async function createAndGetChat(chat: Chat): Promise<chats> {

    return await prisma.chats.upsert({
        where: { chat_id: chat.getId() },
        update: {
            title: chat.getTitle(),
            type: chat.getType()
        },
        create: {
            chat_id: chat.getId(),
            title: chat.getTitle() ?? "Unknown",
            type: chat.getType(),
            joined: true
        }

    }).then(async (response) => {
        return response;

    }).catch(async (e: Error) => {
        throw e;

    }).finally(() => {
        prisma.$disconnect();
    });
}

/**
 * Returns a chat by ID.
 *
 * @author Marcos Leandro
 * @since  2025-04-02
 *
 * @param id
 *
 * @return Chat object.
 */
export async function getChatById(id: number): Promise<chats | null> {

    return await prisma.chats.findUnique({
        where: { id: id }

    }).then(async (response) => {
        return response;

    }).catch(async (e: Error) => {
        throw e;

    }).finally(() => {
        prisma.$disconnect();
    });
}
