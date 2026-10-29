import { PROFILES } from "./profiles";
import type { Query } from "./db";

// Loads the fictional sample members so a fresh install has people to swipe
// on. Seed members have no email or password and can't log in; set
// SEED_MEMBERS=off to launch without them (and to remove any already loaded).
// Runs on every start, so edits to PROFILES reach existing databases.
export async function seedMembers(run: Query) {
  if (process.env.SEED_MEMBERS === "off") {
    await run("delete from users where is_seed");
    return;
  }
  const ids = PROFILES.map((p) => `seed-${p.id}`);
  await run("delete from users where is_seed and not (id = any($1))", [ids]);

  for (const p of PROFILES) {
    const birth = new Date();
    birth.setFullYear(birth.getFullYear() - p.age);
    birth.setMonth(birth.getMonth() - 2);
    await run(
      `insert into users (id, name, birthdate, gender, show_me, city, country, flag, bio, vibe,
         languages, interests, occupation, traveling, prompts, palette, verified, is_seed, seed_likes_back, into_tags, discreet)
       values ($1,$2,$3,$4,'everyone',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,true,$17,$18,$19)
       on conflict (id) do update set name = excluded.name, birthdate = excluded.birthdate, gender = excluded.gender,
         city = excluded.city, country = excluded.country, flag = excluded.flag, bio = excluded.bio, vibe = excluded.vibe,
         languages = excluded.languages, interests = excluded.interests, occupation = excluded.occupation,
         traveling = excluded.traveling, prompts = excluded.prompts, palette = excluded.palette, verified = excluded.verified,
         seed_likes_back = excluded.seed_likes_back, into_tags = excluded.into_tags, discreet = excluded.discreet`,
      [
        `seed-${p.id}`,
        p.name,
        birth.toISOString().slice(0, 10),
        p.gender,
        p.city,
        p.country,
        p.flag,
        p.bio,
        p.vibe,
        p.languages.join(", "),
        p.interests.join(", "),
        p.occupation,
        p.traveling ?? null,
        JSON.stringify(p.prompts),
        p.palette.join(","),
        p.verified,
        p.likesYou,
        (p.into ?? []).join(", "),
        !!p.discreet,
      ],
    );
  }
}
