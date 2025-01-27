import { Command, type ChatInputCommand } from '@sapphire/framework'
import { guildCtxManager } from '../index.js'
import { checkUserAlreadyJoined } from '../components/preCheck.js'
import type { InteractionReplyOptions } from 'discord.js'
import { PowError } from '../errors/index.js'

export class LeaveCommand extends Command {
  public constructor(
    context: ChatInputCommand.Context,
    options: ChatInputCommand.Options,
  ) {
    super(context, {
      ...options,
      description: 'ボイスチャンネルから退出します。',
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

      const ctx = guildCtxManager.get(interaction.member.guild)
      const textChannel = ctx.connectionManager.channelMap.get(voiceChannel)
      const workerId = ctx.leave(voiceChannel)

      interactionReplyOptions = {
        embeds: [
          {
            color: 0x00ff00,
            title: 'ボイスチャンネルから退出しました。',
            description: [
              `担当BOT: <@${workerId}>`,
              `テキストチャンネル: ${textChannel}`,
              `ボイスチャンネル: ${voiceChannel}`,
              'またのご利用をお待ちしております。',
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
