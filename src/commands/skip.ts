import { Command, type ChatInputCommand } from '@sapphire/framework'
import { guildCtxManager } from '../index.js'
import {
  HandleInteractionError,
  HandleInteractionErrorType,
  PowError,
} from '../errors/index.js'
import type { InteractionReplyOptions } from 'discord.js'
import { checkUserAlreadyJoined } from '../components/preCheck.js'

export class SkipCommand extends Command {
  public constructor(
    context: ChatInputCommand.Context,
    options: ChatInputCommand.Options,
  ) {
    super(context, {
      ...options,
      description: '今読み上げている内容をスキップします。',
    })
  }

  public override registerApplicationCommands(
    registry: ChatInputCommand.Registry,
  ) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setDMPermission(false),
    )
  }
  public override async chatInputRun(
    interaction: ChatInputCommand.Interaction,
  ) {
    if (!interaction.inCachedGuild()) return
    const user = await interaction.member.fetch()
    const voiceChannel = user.voice.channel

    let interactionReplyOptions: InteractionReplyOptions = {
      embeds: [
        {
          color: 0xff0000,
          title: '予期せぬエラーが発生しました。',
        },
      ],
      ephemeral: true,
    }

    try {
      checkUserAlreadyJoined(voiceChannel)

      const connectionCtx = guildCtxManager
        .get(interaction.member.guild)
        .connectionManager.getWithVoiceChannel(voiceChannel)
      if (connectionCtx === undefined)
        throw new HandleInteractionError(
          HandleInteractionErrorType.userNotWithBot,
        )

      connectionCtx.player?.stop()
      const workerId = connectionCtx.connection.joinConfig.group

      interactionReplyOptions = {
        embeds: [
          {
            color: 0x00ff00,
            title: '読み上げをスキップしました。',
            description: [
              `担当BOT: <@${workerId}>`,
              `テキストチャンネル: ${connectionCtx.readChannel.toString()}`,
              `ボイスチャンネル: ${voiceChannel}`,
            ].join('\n'),
          },
        ],
      }
    } catch (error) {
      if (error instanceof PowError) {
        interactionReplyOptions = error.toInteractionReplyOptions
      } else {
        throw error
      }
    } finally {
      return interaction.reply(interactionReplyOptions)
    }
  }
}
