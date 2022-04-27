const Bots = require("../../../../models/bots");
const Servers = require("../../../../models/servers");
const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "count",
  category: "info",
  aliases: ["bot-count"],
  description: "Provides a total count of bots in our list",
  example: "``*botinfo <@bot>``",
  async execute(message) {
    let bots = await Bots.find({ state: "verified" }, { _id: false });

    const embed = new MessageEmbed()
      .setAuthor("Tumull", message.guild.iconURL())
      .setTitle("Tumull Bot Count")
      .addField("Approved Bots", `${bots.length}`)
      .setColor("#6b83aa")
      .setTimestamp()
      .setFooter("© Tumull | 2022");
    return message.channel.send(embed);
  },
};
