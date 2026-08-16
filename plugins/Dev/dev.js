exports.commands = [
  "version",
  "myid",
  "userid",
];

// A collection of commands primarily useful for developers.
exports.version = {
  description: "Returns the git commit this bot is running.",
  process: function (bot, msg) {
    const commit = require("child_process").spawn("git", ["log", "-n", "1"]);
    commit.stdout.on("data", function (data) {
      const text = data.toString();
      if (text) {
        msg.channel.send(text);
      }
    });
    commit.on("close", function (code) {
      if (code !== 0) {
        msg.channel.send("failed checking git version!");
      }
    });
  },
};

exports.myid = {
  description: "Returns the user ID of the sender.",
  process: function (bot, msg) {
    msg.channel.send(msg.author.id);
  },
};

exports.userid = {
  usage: "[user to get id of]",
  description: "Returns the unique ID of a user. This is useful for permissions.",
  process: function (bot, msg, suffix) {
    if (msg.mentions.members.size > 0) {
      if (msg.mentions.members.size > 1) {
        let response = "multiple users found:";
        for (const id of msg.mentions.members.keys()) {
          response += `\nThe ID of <@${id}> is ${id}`;
        }
        msg.channel.send(response);
      } else {
        const id = msg.mentions.members.firstKey();
        msg.channel.send(`\nThe ID of <@${id}> is ${id}`);
      }
    } else if (suffix) {
      const users = msg.channel.guild.members.cache
        .filter((member) => member.user.username === suffix)
        .array();
      if (users.length === 1) {
        msg.channel.send(`The ID of ${users[0].user.username} is ${users[0].user.id}`);
      } else if (users.length > 1) {
        let response = "multiple users found:";
        for (const user of users) {
          response += `\nThe ID of ${user} is ${user.id}`;
        }
        msg.channel.send(response);
      } else {
        msg.channel.send(`No user ${suffix} found!`);
      }
    } else {
      msg.channel.send(`The ID of ${msg.author} is ${msg.author.id}`);
    }
  },
};
