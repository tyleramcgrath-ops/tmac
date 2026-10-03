import type { WrittenContent } from '../starter'

export const content: WrittenContent = {
  about: {
    heading: 'Electrical work explained plainly and left tidy',
    paragraphs: [
      'Northside Electric is made up of licensed electricians working in homes across Denver. We handle everything from a flickering light to a full panel upgrade, and we approach every job the same way: understand what’s already there, explain it clearly, and do the work so it’s safe, neat and up to code.',
      'Denver has a wide range of houses, from older bungalows with their original wiring to newer builds being asked to power EV chargers, heat pumps and home offices. Each one brings its own surprises behind the walls. Before we start, we’ll walk you through what we found, what we recommend and what can wait. You’ll know what we’re doing and why, and you won’t be pushed toward work you don’t need.',
      'Electrical work often means opening walls and ceilings, so we treat tidiness as part of the job rather than an afterthought. We protect floors, keep the work area contained, label what we change in your panel and clean up before we leave. When we’re finished, you should have a home that works the way it should, and an electrical system you understand a little better than you did before.',
    ],
  },
  services: [
    {
      name: 'Panel upgrades',
      summary:
        'We replace outdated or overloaded electrical panels so your home can safely handle what you plug into it today, from induction ranges to EV chargers.',
      intro:
        'Your electrical panel decides how much power your home can use at once and protects every circuit from overloads. Many Denver homes still run on panels sized for a time before central air, induction cooking, heat pumps and electric cars. Others have panel models with poor safety records, or fuses that have been swapped for the wrong size. We assess what you have, tell you plainly whether it needs replacing, and plan the upgrade around what your home needs now and next.',
      sections: [
        {
          heading: 'What a panel upgrade involves',
          body: 'A panel upgrade can mean replacing the panel itself, increasing the size of the service that feeds the home, or both. The service size, measured in amps, sets how much electricity can flow in from the utility. Raising it usually means a new meter base, larger service entrance wires and coordination with the utility, which has to disconnect and reconnect power. Inside, the new panel gets fresh breakers and a proper grounding and bonding setup, and every circuit is labeled clearly. Sometimes the service is big enough and only the panel needs replacing, because it’s worn out, full, or a type that should be retired.',
        },
        {
          heading: 'Signs it’s time',
          body: 'Breakers that trip whenever several appliances run together point to a panel near its limit. Lights that dim when the air conditioner or microwave kicks on are another hint. A panel with no open slots, or one crowded with tandem breakers squeezed in to make room, has nowhere left to grow. Fuse boxes, panels that feel warm, scorch marks, a buzzing sound or corrosion inside the box all deserve a prompt look. Some older panel brands are known for breakers that may not trip when they should. Often, though, it’s a plan for an EV charger, heat pump, hot tub or addition that brings the question up.',
        },
        {
          heading: 'How upgrade day goes',
          body: 'A panel replacement means the power to your home is off for most of the working day, so we’ll agree on timing ahead of time. Plan to keep refrigerators and freezers closed, and for anyone working from home to find another spot. We shut off power, remove the old panel, mount the new one and move each circuit over, checking wires for damage or undersized conductors as we go. Where the service is being upgraded, the utility visits to disconnect and reconnect. Before power comes back on, we test the work and confirm every circuit is labeled. Work is done to local code and permitted where required.',
        },
        {
          heading: 'Load calculations and your options',
          body: 'Before recommending a bigger service, we run a load calculation: a look at your home’s size and every major appliance, existing and planned, to estimate the real demand. Sometimes that shows the current service can handle an EV charger or heat pump with a smarter approach, such as a load management device that pauses the charger while the dryer and oven are running. Sometimes it confirms an upgrade is the right call. We’ll also talk about spare spaces for future circuits, whole-home surge protection, and whether a generator or solar is on your list, since both affect how the new panel should be set up.',
        },
      ],
      faq: [
        {
          q: 'How long does a panel upgrade take?',
          a: 'Replacing a panel usually takes a day of work in the house, with the power off for much of it. When the service size is increasing, timing also depends on the utility’s schedule for disconnecting and reconnecting. We’ll explain each step, and roughly when it’ll happen, before we begin.',
        },
        {
          q: 'Is my old fuse box dangerous?',
          a: 'Fuses protect circuits well when they’re the correct size. Trouble starts when a blown fuse is replaced with a larger one to stop it from blowing, which lets wires overheat. Fuse boxes also tend to be small for the way homes use power today. If you have one, it’s worth having us look and explain your options.',
        },
        {
          q: 'Can I add surge protection at the same time?',
          a: 'Yes, and it’s a good moment to do it. A whole-home surge protector mounts at or in the panel and helps limit voltage spikes from the grid or from large appliances switching on and off. It works best paired with plug-in protectors for sensitive electronics like computers and televisions.',
        },
      ],
    },
    {
      name: 'EV charger installs',
      summary:
        'Level Two charging at home on a properly sized dedicated circuit, with a straight answer about whether your panel can handle it.',
      intro:
        'Plugging an electric car into an ordinary household outlet works, but it adds only a little range each hour, and many Denver drivers find it can’t keep up with daily driving. A Level Two charger runs on a higher-voltage circuit, like the one a clothes dryer uses, and can comfortably refill a typical day of driving overnight. We check that your panel can support it, run a dedicated circuit to where you park, and install the charger or outlet neatly and safely.',
      sections: [
        {
          heading: 'Hardwired charger or outlet?',
          body: 'There are two common ways to set up home charging. One is a wall charger hardwired straight to its circuit. The other is a heavy-duty outlet that your car’s portable charging cord, or a plug-in wall unit, plugs into. Hardwired units can often charge at higher power, keep the cable tidy, and avoid wear on an outlet that gets plugged and unplugged regularly. An outlet offers flexibility if you might take the charger with you or change vehicles. Many chargers let you schedule charging for off-peak utility hours from an app. We’ll help you match the setup to your car, your driving and your parking spot.',
        },
        {
          heading: 'Can your panel handle it?',
          body: 'An EV charger is one of the largest continuous loads a home can carry, often running for hours at a stretch. Before installing one, we look at your panel’s service size, how full it is, and what else draws heavy power, like an electric range, dryer, water heater or air conditioner. A load calculation tells us whether there’s enough capacity. If there is, we add a dedicated breaker. If it’s tight, options include charging at a slightly lower setting, a load management device that shares power between the charger and other appliances, or a panel upgrade. We’ll explain which makes sense for your home.',
        },
        {
          heading: 'Installation day',
          body: 'When the panel has room, most installs are finished in a single visit. We confirm where you want the charger, usually where the cable reaches the charge port easily without crossing a walkway. Then we run wire from the panel through the garage, basement or attic, or along the outside of the house in conduit for driveway charging. We mount the charger or outlet, connect the breaker, and set the charger’s current to match the circuit. Before we leave, we power it up, check that your car starts charging, and show you how to reset the breaker if you ever need to. Work is done to local code and permitted where required.',
        },
        {
          heading: 'Planning for what comes next',
          body: 'If a second electric car is in your future, mention it now. Running wire sized for more power, or choosing chargers that can share one circuit and split power between two vehicles, is far easier than starting over later. Outdoor installs need a charger rated for the weather and a mounting spot clear of snow piles and sprinklers. Think about cable reach if you sometimes park nose-in and sometimes back in. Utilities and government programs sometimes offer rebates on chargers or off-peak charging rates, so it’s worth checking what applies before you buy. We can also leave room for solar or battery storage you might add down the road.',
        },
      ],
      faq: [
        {
          q: 'How fast will my car charge at home?',
          a: 'That depends on the charger, the circuit and your car’s onboard charger, which sets a ceiling no matter what you plug into. For most drivers, a Level Two setup comfortably covers a day of driving overnight. Your owner’s manual lists the car’s maximum home charging rate, and we size the circuit to suit it.',
        },
        {
          q: 'Can I install a charger outside?',
          a: 'Yes, with a charger rated for outdoor use and wiring run in weatherproof conduit. Mount it out of the path of snow shoveling and swinging car doors, and close enough that the cable reaches without stretching. An outdoor charging outlet needs a weather-resistant cover that stays closed while something is plugged in.',
        },
        {
          q: 'Does cold weather affect home charging?',
          a: 'Batteries charge more slowly when they’re very cold, and some energy goes into warming the pack first. Charging in a garage helps. Many cars let you schedule charging to finish just before you leave, so the battery and cabin are already warm when you set off on a winter morning.',
        },
      ],
    },
    {
      name: 'Lighting and fans',
      summary:
        'New fixtures, recessed lighting, dimmers, under-cabinet lights and ceiling fans, installed securely and wired so they work the way you expect.',
      intro:
        'Good lighting changes how a room feels and how well you can use it. A single fixture in the middle of the ceiling leaves corners dim and kitchen counters in shadow, while layered light lets you set the room for cooking, reading or a quiet evening. We install fixtures, recessed lights, dimmers, under-cabinet strips, outdoor lighting and ceiling fans in homes across Denver, and we make sure the boxes, wiring and switches behind them are up to the job.',
      sections: [
        {
          heading: 'Planning light in layers',
          body: 'Lighting designers talk about three layers. Ambient light fills the room, usually from ceiling fixtures or evenly spaced recessed lights. Task light shines where you work: under kitchen cabinets, over an island, beside a mirror or next to a reading chair. Accent light draws the eye to art, shelves or texture on a wall. Most rooms benefit from at least two layers on separate switches or dimmers. Color temperature matters too: warmer light tends to feel relaxed in living spaces, while slightly cooler light can help in kitchens and work areas. We’ll talk through how you use each room before suggesting where the lights should go.',
        },
        {
          heading: 'Ceiling fans done right',
          body: 'A ceiling fan is heavy and it moves, so it needs a fan-rated electrical box fastened firmly to the framing, not the light-duty box that held a fixture. We check what’s in the ceiling and add a brace if needed. Fan size should suit the room, and the blades should sit well above head height, with a downrod for tall or sloped ceilings. If you want the fan and its light controlled separately from the wall, that often means running an extra wire to the switch. In summer, set the fan to push air down; in winter, reverse it to gently move warm air off the ceiling.',
        },
        {
          heading: 'Recessed lights, dimmers and LED quirks',
          body: 'Recessed lights today are often slim LED fixtures that need only a small hole and fit well in ceilings without much attic space above. In insulated ceilings, they must be rated for contact with insulation. Dimmers need to be matched to the lights they control; pairing an older dimmer with LED bulbs is the usual cause of flicker, buzzing or lights that won’t dim smoothly. If you’ve switched to LEDs and things don’t behave, the fix is often a compatible dimmer rather than new fixtures. Smart switches and dimmers are an option too, though many need a neutral wire in the switch box, which some older Denver homes lack.',
        },
        {
          heading: 'How an installation visit goes',
          body: 'We start by confirming exactly where each fixture, switch and dimmer will go, then protect the floors and furniture below. Swapping a fixture on an existing box is usually quick. Adding new lights means finding a path for wiring through the attic, the walls or between floor joists, and we cut small, neat openings only where we need them. We check that each box is properly supported and that the circuit has room for the added load. Once everything is in, we test each switch and dimmer through its full range and clean up the dust. If any drywall openings need patching, we’ll talk that through with you beforehand.',
        },
      ],
      faq: [
        {
          q: 'Can I put a ceiling fan where my light fixture is?',
          a: 'Often, but the existing box usually isn’t rated to hold a fan’s weight and motion. We’ll check it and, if needed, replace it with a fan-rated box or brace secured to the framing. We’ll also see whether the wiring allows the fan and light to be controlled separately from the wall.',
        },
        {
          q: 'Why do my LED lights flicker?',
          a: 'Flicker usually comes from a dimmer that wasn’t designed for LEDs, a bulb that isn’t dimmable, or different bulbs mixed on one dimmer. Loose connections can cause it too, and those are worth checking because they can overheat. Start by confirming the bulbs are dimmable; if that isn’t it, we can look at the dimmer and wiring.',
        },
        {
          q: 'What should I know about outdoor lighting?',
          a: 'Outdoor fixtures need to be rated for wet or damp locations, depending on how exposed they are, and connections must be sealed against the weather. Motion sensors and dusk-to-dawn controls help with security and save energy. For path and garden lights, low-voltage systems are simpler and safer to run through planting beds and around patios.',
        },
      ],
    },
    {
      name: 'Whole-home rewiring',
      summary:
        'Replacing old, damaged or unsafe wiring throughout a home, planned carefully to keep wall openings small and disruption manageable.',
      intro:
        'Wiring is meant to last a long time, but not forever. Some Denver homes still rely on knob-and-tube wiring, ungrounded circuits or cloth-insulated cable that has grown brittle with age. Others were wired well enough originally but have since been added to by previous owners, with questionable splices and overloaded circuits. Rewiring replaces that old system with modern grounded cable, properly sized circuits and safe connections, so the house can handle the way you live in it today. We plan the work to be as tidy and manageable as possible.',
      sections: [
        {
          heading: 'When rewiring makes sense',
          body: 'Knob-and-tube wiring, recognizable by porcelain knobs and tubes in attics and basements, has no ground wire and was never meant to be buried in insulation. Cloth-covered cable in mid-century homes can crack and crumble when it’s disturbed. Two-prong outlets throughout the house usually mean there’s no grounding. Other signs include outlets or switches that feel warm, frequently tripped breakers, lights that flicker for no clear reason, a burning smell, or a history of do-it-yourself additions. Not every old wire needs replacing right away, and partial rewiring works well in some homes. We’ll inspect what you have and explain which circuits concern us and why.',
        },
        {
          heading: 'How we plan the work',
          body: 'Rewiring a lived-in home is mostly a question of access. We map every circuit, then plan routes for new cable through attics, basements, crawlspaces and interior walls, fishing wire behind the drywall or plaster wherever we can. Openings are kept small and placed where they’re easiest to repair, often near the top of a wall or inside closets. We usually work one area at a time, so most of the house keeps power each day. It’s also the right moment to add outlets where you’ve always wanted them, give kitchens and bathrooms their own dedicated circuits, and bring the panel up to date if it needs it.',
        },
        {
          heading: 'Plaster walls and older houses',
          body: 'Many older Denver houses have plaster and lath walls, which are harder to open and patch than drywall and can crack if handled carelessly. We cut plaster slowly, use attic and basement routes as much as the house allows, and talk with you about where openings will land. In balloon-framed homes, where wall cavities run from basement to attic, fishing wire can be easier. Homes with fire blocking, finished basements or very little attic space call for more creativity. Asbestos or lead paint can turn up in older houses too; if we suspect it somewhere we need to disturb, we’ll stop and talk about testing first.',
        },
        {
          heading: 'Getting ready and living with the work',
          body: 'Clear space along the walls in the rooms we’re working in, and take fragile items off shelves and walls that share a cavity with our work. Expect some dust despite plastic sheeting and floor protection. Plan for stretches without power in parts of the house; we’ll tell you each morning which areas will be affected. Patching and painting the openings is usually done by a drywall or plaster finisher once we’re finished, and we can talk through how to line that up. When everything is energized, we test each circuit, update your panel labels and walk you through what has changed.',
        },
      ],
      faq: [
        {
          q: 'Can we stay in the house during a rewire?',
          a: 'In most cases, yes. Because we work area by area, the rest of the home usually keeps power while one section is being rewired. Some days are more disruptive than others, especially when we’re working in the kitchen, so we’ll give you a heads-up about what to expect before each day starts.',
        },
        {
          q: 'Is knob-and-tube wiring always dangerous?',
          a: 'Not automatically. When it’s intact and undisturbed, it can keep working. The trouble comes from age, insulation packed around it, brittle coverings and later splices into newer wire. It also lacks a ground, which modern appliances and electronics expect. Many insurers ask about it, and it limits what you can safely add to the home.',
        },
        {
          q: 'Will I need new drywall everywhere?',
          a: 'No. A careful rewire usually leaves a series of small openings, not torn-out walls. Much of the work happens through attics, basements and existing outlet boxes. The openings that are needed get patched afterward, and many homeowners plan to repaint once the rewire is done, since it’s a natural time to freshen up the walls.',
        },
      ],
    },
    {
      name: 'Generators',
      summary:
        'Standby generators and portable generator hookups, connected through a transfer switch or interlock so you can keep the essentials running safely in an outage.',
      intro:
        'Power outages in Denver tend to arrive with the weather: heavy spring snow on tree limbs, summer storms, high winds and, now and then, planned shutoffs to reduce wildfire risk. A generator keeps the furnace, refrigerator, sump pump and internet running until the lights come back. Permanently installed standby units and portables you roll out when needed both depend on a safe connection to your home. We help you choose the right setup and install that connection properly.',
      sections: [
        {
          heading: 'Standby or portable?',
          body: 'A standby generator sits outside on a pad, runs on natural gas or propane, and starts on its own moments after an outage through an automatic transfer switch. It can power a chosen set of circuits or the whole home, and you don’t need to be there for it to work. A portable generator costs less to buy and can do other jobs, but it needs fuel, has to be wheeled out and started by hand, and powers only a limited number of circuits. Both are good options. The right one depends on how long your outages tend to last, what you need to keep running and your budget.',
        },
        {
          heading: 'Connecting safely to your home',
          body: 'A generator must never feed power into a house without a proper transfer device. Plugging one into a dryer outlet with a homemade cord, sometimes called backfeeding, can send electricity out onto utility lines and injure line workers, and it can damage your home’s wiring. The safe options are a transfer switch, which moves selected circuits from the utility to the generator, or an interlock kit, which mechanically prevents the main breaker and the generator breaker from being on at the same time. For portables, we install an inlet box outside so you can connect the generator to the house with a single cord.',
        },
        {
          heading: 'Sizing and placement',
          body: 'Sizing starts with a list of what you need during an outage: furnace blower, refrigerator, freezer, sump pump, some lights and outlets, and perhaps a well pump or medical equipment. Motors draw a surge when they start, so we account for that as well as the steady running load. Whole-home coverage calls for a larger standby unit or a load management system. Placement matters as much as size. Generators produce carbon monoxide, so they must stay outdoors, well away from windows, doors and vents, and never in a garage, even with the door open. Standby units also need clearance from the house and a fuel supply sized for them.',
        },
        {
          heading: 'Keeping it ready for the next outage',
          body: 'A generator that hasn’t run in a long while may not start when you need it. Standby units run short self-tests on a schedule and need regular oil changes, filters and battery checks, much like a car. Run a portable under load every month or two, keep fresh fuel with stabilizer on hand, and store the inlet cord where you can find it in the dark. Write down the order in which you’ll switch circuits on, so you don’t overload the generator all at once. Put carbon monoxide alarms inside the house, and test them before the stormy season arrives.',
        },
      ],
      faq: [
        {
          q: 'Can a generator run my whole house?',
          a: 'It can, with a large enough standby unit or a load management system that sheds less important loads when demand peaks. Many homeowners choose to cover the essentials instead, which allows a smaller generator. We’ll help you list what truly matters to you during an outage and size the system around that.',
        },
        {
          q: 'Do I need a transfer switch for a portable generator?',
          a: 'To connect a portable to your home’s wiring, yes, or an interlock kit with an inlet box. Without one, power can flow back onto utility lines. If you only plan to run a couple of appliances on heavy-duty extension cords, no connection to the house is needed, but the generator must stay outdoors and away from openings.',
        },
        {
          q: 'How loud is a standby generator?',
          a: 'While running, most sound something like a central air conditioner, sometimes a bit louder, and they’re quiet the rest of the time apart from short scheduled exercise runs. Local rules and some neighborhood associations set distances from property lines and windows, so we plan placement with those in mind.',
        },
      ],
    },
    {
      name: 'Safety inspections',
      summary:
        'A thorough look at your home’s electrical system, from the service and panel to outlets and alarms, with a clear explanation of what we find.',
      intro:
        'Most electrical problems are invisible until they cause trouble. A loose connection, a double-tapped breaker or a missing ground looks perfectly fine from the living room. A safety inspection is a careful walk through your home’s electrical system to catch issues like these early. It’s useful when buying or selling a home in Denver, after a renovation, when an older house is new to you, or simply when something doesn’t feel right. You get a plain explanation of what we found and what should come first.',
      sections: [
        {
          heading: 'What we look at',
          body: 'We start outside with the overhead or underground service, the meter base and the grounding connection. Inside, we open the panel and check breaker sizes against wire sizes, look for double-tapped breakers, scorching, corrosion and loose connections, and confirm grounding and bonding. Then we move through the house, testing outlets for correct wiring and grounding, checking for ground-fault protection in kitchens, bathrooms, garages, basements and outdoors, and looking for arc-fault protection where it applies. We check visible wiring in the attic, basement and garage, look at smoke and carbon monoxide alarms, and note any extension cords doing a permanent job.',
        },
        {
          heading: 'Signs it’s worth booking one',
          body: 'Some homes give clear hints. Breakers that trip regularly, outlets that feel warm or spark when you plug something in, lights that dim or flicker, a faint hot-plastic smell, or buzzing from switches or the panel all deserve attention soon. Other reasons are quieter: you’ve just bought a home, especially an older one; previous owners did their own electrical work; you’re planning a renovation, EV charger or heat pump; or nobody can remember the last time anyone looked inside the panel. Burn marks or a persistent hot smell are reasons to call promptly rather than wait for a convenient day.',
        },
        {
          heading: 'Understanding GFCI and AFCI protection',
          body: 'Two kinds of protection come up in almost every inspection. A GFCI, or ground-fault circuit interrupter, cuts power in a fraction of a second if it senses current leaking where it shouldn’t, such as through a person standing on a wet floor. You’ll recognize them by the test and reset buttons, though some are built into breakers in the panel. An AFCI, or arc-fault circuit interrupter, watches for the electrical signature of arcing from damaged cords, loose connections or a nail driven through a wire, which can start fires inside walls. Older homes often lack both, and adding them is usually a straightforward improvement.',
        },
        {
          heading: 'What happens after the walkthrough',
          body: 'When the inspection is done, we go over what we found with you in plain language. We sort the issues into what needs fixing soon for safety, what’s worth planning for, and what’s simply a note for the future. Photos help explain things you can’t easily see, like the inside of the panel. You’re never obligated to have us do any follow-up work, and nothing needs to be fixed that day unless it’s an immediate hazard. If you’re buying, selling or renovating, a clear picture of the electrical system helps you plan and budget with fewer surprises along the way.',
        },
      ],
      faq: [
        {
          q: 'Is this the same as a home inspection?',
          a: 'A general home inspector covers the whole house and takes a broad look at the electrical system. An electrician’s inspection goes deeper on that one system: opening the panel, testing circuits and judging the quality of past work. Many buyers get both, especially for older homes or when the home inspection flagged electrical concerns.',
        },
        {
          q: 'How often should a home’s electrical system be checked?',
          a: 'There’s no single rule. Good times are when you buy a home, before a major renovation, when adding large loads like an EV charger, or whenever you notice warning signs. Older homes, and homes with a lot of past do-it-yourself work, benefit from a look more often than newer ones.',
        },
        {
          q: 'Should I test my GFCI outlets myself?',
          a: 'Yes, and it’s easy. Press the test button: the outlet should click off and anything plugged into it should lose power. Press reset to restore it. Doing this every month or so confirms the protection still works. If an outlet won’t trip or won’t reset, it should be replaced.',
        },
      ],
    },
  ],
}
