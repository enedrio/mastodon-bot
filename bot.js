const Mastodon = require('mastodon-api');
const env = require('dotenv');
const fs = require('fs');

env.config();

console.log("Mastodon bot starting. . . ")

const M = new Mastodon({
    client_secret: process.env.CLIENT_SECRET,
    client_key: process.env.CLIENT_KEY,
    access_token: process.env.AUTH_TOKEN,
    timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
    api_url: 'https://botsin.space/api/v1/', // optional, defaults to https://mastodon.social/api/v1/
  })
const params = {
    spoiler_text: "New replacement school plan!",
    status: "Here is the new school plan: "
}
  M.post('statuses', params, (error, data) => {
      if (error){
          console.error(error);
      } else {
          fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
          console.log("Successful at " + data.created_at + " with ID " + data.id);
      }
  });