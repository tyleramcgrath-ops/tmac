# SaySites Instagram pack: posting guide for Claude

You're setting up and posting the @saysites Instagram account, using the files in this folder. Everything to post is listed in `manifest.json`: profile settings, nine feed posts in order with their captions, hashtags and alt text, five Stories and five highlight covers. Use the wording exactly as written.

## Ground rules

- **The account owner signs in, not you.** If Instagram asks for a password, a code or a login check, stop and ask the owner to do it.
- **Post in order.** Feed posts go up in `order` 1 to 9, so post 9 ends up at the top left of the grid. Within a post, upload the files in the order listed; that's the carousel order.
- **Use the 4:5 shape.** When Instagram offers a crop, choose the original or 4:5 (portrait) size. Never crop to a square, because it cuts off the text.
- **Copy captions exactly**, then add a blank line and the post's hashtags at the end.
- **Add alt text to every image.** Where `alt` is a list, each entry goes with the carousel image in the same position.
- **Don't change the wording.** Don't add prices, name other companies, or promise rankings or a number of leads. If something seems wrong, ask the owner rather than editing it.
- **Ask before you send.** Show the owner the finished post on the final "Share" step and get a yes before clicking Share.

## 1. Profile (do this first)

On instagram.com: click the profile picture (bottom left), then **Edit profile**.

1. **Profile photo:** upload `profile/profile-photo.png`.
2. **Name:** `SaySites · Websites that bring in leads`
3. **Bio:** copy the `bio` text from `manifest.json`, keeping its line breaks.
4. **Link:** add `https://saysites.com/redesign` with the title `Free redesign`.
5. Save.

Category and contact buttons can only be set in the Instagram phone app (**Edit profile → Category**). Leave those to the owner, or do them if you're working in the app: category **Web Designer**, or the closest match.

## 2. Feed posts

For each post in `manifest.json`, in order 1 to 9:

1. On instagram.com, click **Create** (the + in the left menu), then **Post**.
2. Click **Select from computer** and choose the post's files. For carousels, select all of them, in the listed order.
3. On the crop step, keep the original 4:5 shape. Click **Next** and skip filters with **Next** again.
4. Paste the caption, then a blank line, then the hashtags separated by spaces.
5. Open **Accessibility** (under the caption) and paste the alt text into each image's box.
6. Leave location and collaborators empty. Turn off **Share to Facebook** unless the owner asks for it.
7. Show the owner, then click **Share**.

**Schedule** (the `day` field): day 1 is posts 1, 2 and 3, about 20 minutes apart, so the first row of the grid fills at once. Then post one a day: post 4 on day 2, post 5 on day 3, through post 9 on day 7. A weekday morning around 8–9 am local time works well for businesses.

## 3. Stories

Stories with link stickers can only be posted from the Instagram **phone app**. If you're working in a desktop browser, skip this section and tell the owner which Stories are due each day.

In the app: tap **+**, choose **Story**, then pick the file.
- For Stories with a `sticker` in `manifest.json`: tap the sticker icon, choose **Link**, enter the URL, set the sticker text, and place it over the dashed box on the image.
- Post them on the days listed.

## 4. Highlights

After a Story is posted, add it to its highlight. This is phone app only too: open the profile, tap **+ New** under the bio, pick the Story, and type the title from `stories[].highlight`. Then choose **Edit cover** and use the matching file from `highlights/`. There are five highlights: Work, Law firms, Medical, Leads, Free redesign.

## 5. Afterwards

- Reply to comments and messages within a day. Anyone asking about a website should be sent to saysites.com/redesign or invited to send a message.
- Don't pay to boost posts unless the owner asks.
- Tell the owner what you posted, with the post links.
