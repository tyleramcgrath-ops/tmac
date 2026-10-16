import { PROFILES } from "./profiles";
import type { Query } from "./db";

// Loads the fictional sample members so a fresh install has people to swipe
// on. Seed members have no email or password and can't log in; set
// SEED_MEMBERS=off to launch without them.
export async function seedMembers(run: Query) {
  if (process.env.SEED_MEMBERS === "off") return;
  const [{ n }] = await run<{ n: number }>("select count(*)::int as n from users where is_seed");
  if (n > 0) return;

  for (const p of PROFILES) {
    const birth = new Date();
    birth.setFullYear(birth.getFullYear() - p.age);
    birth.setMonth(birth.getMonth() - 2);
    await run(
      `insert into users (id, name, birthdate, gender, show_me, city, country, flag, bio, vibe,
         languages, interests, occupation, traveling, prompts, palette, verified, is_seed, seed_likes_back)
       values ($1,$2,$3,$4,'everyone',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,true,$17)
       on conflict (id) do nothing`,
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
      ],
    );
  }
}
