import { Command, type ChatInputCommand } from '@sapphire/framework'
import { guildCtxManager } from '../index.js'
import { objToList } from '../utils.js'

export class JoinCommand extends Command {
  public constructor(
    context: ChatInputCommand.Context,
    options: ChatInputCommand.Options,
  ) {
    super(context, {
      ...options,
      description: '現在の声の設定を確認します。',
    })
  }

  public override registerApplicationCommands(
    registry: ChatInputCommand.Registry,
  ) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setDMPermission(false)
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('ユーザーの声の設定を確認できます。')
            .setRequired(false),
        ),
    )
  }
  public override async chatInputRun(
    interaction: ChatInputCommand.Interaction,
  ) {
    if (!interaction.inCachedGuild()) return
    const user = interaction.options.getUser('user')
    const userSetting = await guildCtxManager
      .get(interaction.member.guild)
      ._getUserSetting(user ? user.id : interaction.member.id)
    const userNameText = user
      ? `${user.username}#${user.discriminator}`
      : '現在'

    return interaction.reply({
      embeds: [
        {
          color: 0x00ff00,
          title: `${userNameText}の声の設定`,
          description:
            '```\n' +
            objToList(userSetting).split('\n').slice(1).join('\n') +
            '\n```',
        },
      ],
      ephemeral: true,
    })
  }
}