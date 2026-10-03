import type { WrittenContent } from '../starter'

export const content: WrittenContent = {
  about: {
    heading: 'Keeping Treasure Valley homes comfortable in every season',
    paragraphs: [
      'Boise asks a lot of a home’s heating and cooling. Winter nights drop well below freezing, summer afternoons bake the valley floor, and the dry air and dust in between work their way into every filter and duct. We keep homes across the Treasure Valley comfortable through all of it, from the first cold snap in the fall to the last heat wave of late summer.',
      'Our work covers the whole system: furnaces, air conditioners, heat pumps, ductwork, thermostats and the regular upkeep that keeps them running well. When we come out, we start by listening to what you’ve noticed at home, then we look at the equipment itself before recommending anything. If a repair makes more sense than a replacement, we say so.',
      'We think you should understand what is happening inside your own walls. So we explain what we find in plain language, show you the worn part or the dirty coil when we can, and lay out your options so you can decide without pressure. A comfortable house should feel simple to live in, and the people who look after it should make it feel that way too.',
    ],
  },
  services: [
    {
      name: 'Furnace repair',
      summary: 'Diagnosis and repair for furnaces that won’t light, short-cycle, blow cold air or make new noises, with a clear explanation of what failed and why.',
      intro: 'A furnace rarely quits without warning. Most of the time it gives hints first: a burner that takes a few tries to light, a blower that runs longer than it used to, a faint smell when the heat comes on for the first time in the fall. In a Boise winter those hints matter, because a cold house on a frozen night is more than an inconvenience. We track down the cause, repair what’s actually broken, and explain what we found before we leave.',
      sections: [
        {
          heading: 'Signs your furnace needs attention',
          body: 'Some warnings are obvious, like a furnace that runs but blows cool air, or one that won’t start at all. Others are quieter. Short cycling, where the system turns on and off every few minutes, often points to overheating, a dirty flame sensor or a thermostat in the wrong spot. Rooms that never quite warm up can mean a failing blower motor or a blocked return. Rumbling, squealing or banging noises usually come from delayed ignition or worn belts and bearings. A yellow, flickering burner flame instead of a steady blue one, or soot near the burners, is worth a call right away.',
        },
        {
          heading: 'How we track down the problem',
          body: 'We start with what you’ve noticed, because the timing of a symptom tells us a lot. Then we work through the furnace in order: the thermostat signal, power and safety switches, the igniter and flame sensor, gas pressure, the burners, the blower and the airflow across the whole system. Many modern furnaces store error codes on the control board, and we read those too. We check the venting so exhaust leaves the house the way it should, and we look over the heat exchanger for cracks. Before any repair, you’ll hear what we found, what we recommend and the reasoning behind it.',
        },
        {
          heading: 'Common repairs and what causes them',
          body: 'A lot of furnace trouble traces back to a handful of parts. Flame sensors collect a thin coating over time and stop recognizing the flame, so the furnace shuts down after a few seconds. Hot surface igniters crack with age. Inducer motors, which pull exhaust through the vent before the burners light, wear out and get noisy. Pressure switches and their small hoses can fail or clog with condensation. Clogged filters make the furnace run hot, which trips the limit switch and wears every other part faster. Knowing why a part failed helps keep the next one from going the same way.',
        },
        {
          heading: 'When repair stops making sense',
          body: 'Most furnaces are worth repairing, and we treat replacement as a last option rather than a starting point. Still, there comes a point where it deserves an honest conversation. A cracked heat exchanger is a safety issue, because it can let combustion gases into the air you breathe. An older furnace that needs one expensive part after another may cost more over the next few winters than a new one would. Rising gas bills with no change in your habits can signal declining efficiency. When we see those signs, we lay out both paths side by side so you can weigh them yourself.',
        },
      ],
      faq: [
        {
          q: 'Is it safe to keep running a furnace that’s acting up?',
          a: 'It depends on the symptom. A noisy blower is usually a nuisance, not a hazard. A smell of gas, soot around the burners, a carbon monoxide alarm or a flame that wavers when the blower starts are different. In those cases, turn the furnace off, leave the house if you smell gas, and call your gas utility first.',
        },
        {
          q: 'Can a dirty filter really cause a breakdown?',
          a: 'Yes. A clogged filter starves the furnace of air, so the heat exchanger runs hotter than it was designed to. The high limit switch then shuts the burners off to protect it, and the furnace cycles on and off. Over a season, that extra heat and stress wears out parts sooner.',
        },
        {
          q: 'What should I check before calling?',
          a: 'Make sure the thermostat is set to heat and its batteries are fresh, the service switch near the furnace is on, the breaker hasn’t tripped and the filter isn’t clogged. Also check that the furnace door is fully closed, since a safety switch keeps the system off when the panel is loose.',
        },
      ],
    },
    {
      name: 'AC installation',
      summary: 'New central air conditioning sized to your house and matched to your ductwork, with the airflow, refrigerant and drainage details handled carefully.',
      intro: 'Summer in Boise is dry and hot, with long afternoons that push an air conditioner hard and cool nights that tempt people to open the windows. A new system should handle the hottest stretch without running constantly or leaving the far bedroom stuffy. Getting there has less to do with the box outside than with how the system is chosen and installed. We size it to your home, check the ducts it depends on and set it up carefully so it can do its job.',
      sections: [
        {
          heading: 'Sizing comes before shopping',
          body: 'Bigger is not better with air conditioning. An oversized unit cools the air quickly, satisfies the thermostat and shuts off before it has run long enough to even out temperatures across the house. That short cycling wears parts and leaves some rooms warm. An undersized unit runs nonstop on the hottest days and still falls behind. Proper sizing uses a load calculation that accounts for your home’s floor area, insulation, windows, which way the house faces and how much shade it gets. It takes a little longer than copying the old unit’s label, and it gives a far better starting point.',
        },
        {
          heading: 'Signs it’s time to replace',
          body: 'Plenty of air conditioners can be repaired, so replacement should be a reasoned choice. One common reason is an older system that uses a refrigerant no longer produced, which makes recharging it costly. A failed compressor on an aging unit is another, since that repair can approach the cost of new equipment. Some homeowners replace because the system can’t keep up anymore, cooling bills keep climbing, or repairs have become a yearly habit. If your furnace is also near the end of its life, replacing both together lets the indoor and outdoor parts be matched properly.',
        },
        {
          heading: 'How installation day goes',
          body: 'Most of the work happens in two places: the condenser outside and the coil that sits on top of your furnace inside. We protect floors along our path, remove the old equipment and recover its refrigerant properly, and set the new condenser on a level pad with room to breathe. The refrigerant lines are cleaned or replaced, brazed, pressure tested for leaks and pulled into a deep vacuum to remove moisture before the system is charged. We connect the condensate drain, wire the thermostat and start everything up. Then we measure temperatures and airflow to confirm the system is running as designed.',
        },
        {
          heading: 'Choices that affect comfort',
          body: 'Beyond capacity, a few decisions shape how a new system feels to live with. Efficiency ratings tell you how much cooling you get for the electricity used; higher ratings cost more up front and save more over time, especially in hot summers. Single-stage units run at full speed or not at all. Two-stage and variable-speed units can run gently for long stretches, which keeps temperatures steadier and the sound lower. The ductwork matters too, since a new system can only deliver the air the ducts can carry. We walk through these trade-offs with you before anything is ordered.',
        },
      ],
      faq: [
        {
          q: 'How long does an AC installation take?',
          a: 'A straightforward replacement using existing ductwork and refrigerant lines often fits within a single day. Jobs that involve new ductwork, a new electrical circuit, moving the condenser or replacing the furnace at the same time take longer. We’ll tell you what to expect before work begins so you can plan around it.',
        },
        {
          q: 'Do I need to replace my ducts too?',
          a: 'Not always. Many duct systems work perfectly well with a new air conditioner. We look for leaks, crushed or disconnected runs, and supply or return openings that are too small for the airflow the new system needs. If changes would help, we explain why and what they involve.',
        },
        {
          q: 'Why does the new unit need a matching indoor coil?',
          a: 'The outdoor condenser and the indoor coil work as a pair, each sized for the other. A mismatched coil can leave the system short on capacity or running less efficiently than its rating suggests. Replacing both together lets them perform the way they were designed to.',
        },
      ],
    },
    {
      name: 'Heat pumps',
      summary: 'Heat pumps that heat and cool from a single system by moving heat instead of burning fuel, chosen and set up for cold winters and hot summers.',
      intro: 'A heat pump looks a lot like an air conditioner, and in summer it works exactly like one. The difference is that it can run in reverse, pulling heat from the outdoor air in winter and bringing it inside. Because it moves heat rather than making it, a heat pump can deliver more warmth than the electricity it uses would produce on its own. Newer cold-climate models keep working well into the kind of freezing weather the Treasure Valley sees each January.',
      sections: [
        {
          heading: 'How a heat pump moves heat',
          body: 'Inside every heat pump is a refrigerant that absorbs heat when it evaporates and releases it when it condenses. In cooling mode, it picks up heat from your rooms at the indoor coil and carries it outside. In heating mode, a reversing valve switches the flow, so the outdoor coil gathers heat from the air and the indoor coil releases it into the house. Even cold air holds usable heat. As the temperature drops, the heat pump has to work harder to collect it, which is why cold-climate models and backup heat matter in places with real winters.',
        },
        {
          heading: 'Is a heat pump a good fit for your home',
          body: 'Heat pumps make the most sense when you want efficient heating and cooling from one system, when you’re replacing an aging air conditioner anyway, or when your home has no gas service. Homes with electric baseboard or other resistance heat often see the biggest change in operating cost. A heat pump can also pair with an existing gas furnace in what’s called a dual-fuel setup: the heat pump handles mild weather and the furnace takes over on the coldest days. Insulation, air sealing and duct condition all affect how well any heat pump performs, so we look at those too.',
        },
        {
          heading: 'Ducted and ductless options',
          body: 'Most homes with existing ductwork can use a ducted heat pump, which replaces the outdoor air conditioner and connects to an indoor air handler or furnace. For houses without ducts, additions, converted garages or rooms that never stay comfortable, ductless mini-splits are a strong choice. They use a small outdoor unit connected by a slim line set to wall-mounted or ceiling heads, each with its own controls. Several heads can share one outdoor unit. That lets you heat and cool only the rooms in use, which suits bonus rooms, basements and home offices that sit empty much of the day.',
        },
        {
          heading: 'Living with a heat pump in winter',
          body: 'A heat pump heats differently than a furnace, and it helps to know what to expect. The air from the vents feels warm rather than hot, because the system runs longer at lower temperatures. On frosty mornings the outdoor unit will pause to defrost its coil, sometimes with a cloud of steam; that’s normal. Backup heat may kick in during very cold spells or when you raise the thermostat sharply. Most people get the best results by choosing a comfortable setting and leaving it, instead of making large setbacks overnight. Keep snow, ice and drifting leaves clear of the outdoor unit.',
        },
      ],
      faq: [
        {
          q: 'Will a heat pump keep my house warm in a hard freeze?',
          a: 'Modern cold-climate heat pumps are designed to keep producing heat well below freezing, though their output drops as it gets colder. That’s why most systems in this area include backup heat, either electric strips or a gas furnace, to cover the coldest nights. We size the system with your winters in mind.',
        },
        {
          q: 'Do heat pumps need different maintenance than an AC?',
          a: 'They need the same basic care, just more of it, since they run in both seasons. Filters should be changed regularly, the outdoor coil kept clean and clear, and the system checked once before cooling season and again before heating season.',
        },
        {
          q: 'Can I keep my gas furnace and add a heat pump?',
          a: 'Yes. A dual-fuel setup pairs a heat pump with your existing furnace, as long as the furnace is in good shape and compatible. The thermostat decides which one runs based on the outdoor temperature, so each handles the conditions it suits best.',
        },
      ],
    },
    {
      name: 'Duct cleaning',
      summary: 'Thorough cleaning of supply and return ducts, registers and the parts of your system that move air, removing built-up dust, debris and construction residue.',
      intro: 'Your ductwork carries every bit of air your furnace and air conditioner deliver, yet most people never see it. Over time, dust, pet hair, drywall residue and the fine grit that drifts in on dry valley winds settle along the inside of those runs. Duct cleaning removes that buildup from the whole system rather than just the vents you can reach. It’s not something every home needs often, but in the right situations it’s worth doing properly.',
      sections: [
        {
          heading: 'When duct cleaning makes sense',
          body: 'There are a few clear reasons to have ducts cleaned. After a remodel or new construction, drywall dust and sawdust often end up inside the ductwork, and the system will keep spreading them around until they’re removed. Visible debris, or dust puffing from registers when the system starts, is another. So is evidence of pests, such as droppings or nesting material in the ducts. Homes with visible mold on duct surfaces need the moisture source addressed along with the cleaning. If you’ve just moved into a house and don’t know its history, a look inside the ducts can tell you whether cleaning is warranted.',
        },
        {
          heading: 'How the cleaning works',
          body: 'Effective cleaning uses two things together: strong suction and agitation. We connect a powerful vacuum to the duct system so the whole network is under negative pressure, which keeps loosened dust moving toward the collector instead of into your rooms. Then we work through the supply and return runs with rotating brushes, air whips and compressed-air tools that knock debris free from the duct walls. Registers and grilles come off and get cleaned separately. We also look at the blower, the coil and the plenum, because cleaning the ducts while leaving a dirty blower behind only solves half the problem.',
        },
        {
          heading: 'Getting ready for the visit',
          body: 'Very little preparation is needed on your end. It helps to clear a path to the furnace and to each register and return grille, moving furniture or boxes a few feet away if they block access. Let us know about rooms with fragile items, and about pets that will need to stay somewhere quiet. The system will be off while we work, so plan for a stretch without heating or cooling. Afterward, put in a fresh filter, since the old one may have caught some of the loosened dust. You might notice a faint smell at first startup as the system settles back in.',
        },
        {
          heading: 'Keeping ducts cleaner afterward',
          body: 'The best way to keep ducts clean is to stop debris from getting in. Change your filter on schedule, and consider a better pleated filter if your system can handle the airflow. Keep return grilles clear, and vacuum around registers when you clean floors. During any remodeling, cover registers and run the system as little as possible until the dust settles. Sealing leaky ducts, especially return runs in attics and crawlspaces, keeps unfiltered dust and insulation fibers from being pulled in. Those everyday habits do more over time than any single cleaning can, and they help your equipment breathe easier too.',
        },
      ],
      faq: [
        {
          q: 'How often should ducts be cleaned?',
          a: 'There’s no fixed schedule that fits every house, and many homes go a long time between cleanings without trouble. Cleaning makes the most sense after construction or remodeling, when pests have gotten in, when there’s visible buildup, or when you’re moving into a home whose history you don’t know.',
        },
        {
          q: 'Will duct cleaning help with allergies?',
          a: 'It removes dust and debris that have collected in the system, but research on health benefits is mixed, so we don’t promise relief. Regular filter changes, good air sealing and keeping indoor humidity in a sensible range usually make a bigger day-to-day difference for allergies.',
        },
        {
          q: 'Is duct cleaning messy?',
          a: 'It shouldn’t be. Because the duct system is kept under strong suction during cleaning, loosened dust moves toward the collection equipment rather than into your rooms. We cover floors along our path, and the registers come off and go back on as part of the job.',
        },
      ],
    },
    {
      name: 'Maintenance plans',
      summary: 'Regular seasonal visits to clean, inspect and tune your furnace, air conditioner or heat pump, giving small problems a chance to be caught early.',
      intro: 'Heating and cooling equipment works hardest at the extremes, which is exactly when you least want it to stop. A maintenance plan sets up regular visits ahead of each season, so your furnace gets attention before the first cold snap and your air conditioner gets a look before summer heat settles over the valley. Each visit focuses on cleaning, testing and adjusting the parts that wear. Ask us about the details of a plan; here’s what a typical visit involves.',
      sections: [
        {
          heading: 'What a heating visit covers',
          body: 'Before the cold arrives, we go through the furnace or heat pump from end to end. On a gas furnace that means inspecting and cleaning the burners, checking the flame sensor and igniter, testing gas pressure and confirming the safety switches shut the system down when they should. We look at the heat exchanger for cracks or corrosion, check the venting and test for carbon monoxide around the appliance. The blower gets cleaned and checked, electrical connections are tightened, and we look at the filter and condensate drain. On a heat pump, we also test the defrost cycle and backup heat.',
        },
        {
          heading: 'What a cooling visit covers',
          body: 'The cooling visit focuses on the parts that do the heavy lifting in summer. We clean the outdoor condenser coil, which collects cottonwood fluff, dust and grass clippings over the year, and straighten bent fins so air can move through. We check refrigerant pressures and temperatures to confirm the charge is right, test capacitors and contactors, and look at the fan motor. Inside, we check the evaporator coil, clear the condensate drain line so it doesn’t back up, and measure the temperature drop across the coil. Thermostat operation and airflow get checked before we finish.',
        },
        {
          heading: 'Why regular visits matter',
          body: 'Most breakdowns start as small, slow changes. A capacitor weakens over a season. A flame sensor collects a coating. A drain line slowly fills with algae. None of these stops the system right away, but each one makes it work harder until something gives, often on the hottest or coldest day of the year. Regular visits are a chance to catch these early, while the fix is simple. Clean equipment also runs closer to its rated efficiency, and many manufacturer warranties expect a record of routine maintenance when it comes time to make a claim.',
        },
        {
          heading: 'What you can do between visits',
          body: 'A few simple habits keep things in good shape between our visits. Check your filter monthly and replace it when it looks gray or clogged; in dusty months or homes with pets, that may be more often than the package suggests. Keep plants, fencing and stored items a couple of feet away from the outdoor unit, and rinse off cottonwood fluff gently with a garden hose when it builds up. Make sure supply registers aren’t blocked by rugs or furniture. If you notice new noises, smells or uneven temperatures, mention them at the next visit or call sooner.',
        },
      ],
      faq: [
        {
          q: 'When should maintenance visits happen?',
          a: 'The ideal timing is spring for cooling and fall for heating, before each system faces its busiest season. Heat pumps benefit from both visits since they run year-round. Scheduling ahead of the first heat wave or cold snap also means any problems surface while there’s time to fix them.',
        },
        {
          q: 'Do I still need to change my own filter?',
          a: 'Yes. Filters fill up much faster than the time between maintenance visits, so changing them yourself is the single most useful thing you can do for your system. We check the filter at each visit and can show you the right size and type.',
        },
        {
          q: 'What happens if a visit turns up a problem?',
          a: 'We explain what we found, why it matters and how urgent it is. Some issues are quick adjustments handled during the visit. Others need parts or more time, and we’ll go over the options before any repair work begins so the decision stays with you.',
        },
      ],
    },
    {
      name: 'Thermostats',
      summary: 'Thermostat installation and setup, from simple programmable models to smart ones, wired correctly and configured for your specific heating and cooling equipment.',
      intro: 'The thermostat is the only part of your heating and cooling system you touch every day, and it decides when everything else runs. An old or poorly placed thermostat can leave rooms too warm or too cold, cycle equipment more than it should and make schedules a chore to manage. A new one, set up properly, gives you better control with less effort. We install and configure thermostats to match your equipment and the way your household actually lives.',
      sections: [
        {
          heading: 'Signs your thermostat is the problem',
          body: 'Sometimes the furnace or air conditioner gets blamed for a thermostat’s mistakes. If the temperature on the display doesn’t match how the room feels, the sensor may be off or the thermostat may sit in a bad spot, such as near a sunny window, a kitchen or a supply register. Systems that short cycle, ignore schedule changes or don’t respond at all can trace back to loose wiring, weak batteries or a failing unit. Older mercury thermostats and dial models also lack the features that heat pumps and staged equipment need, so they can’t run newer systems the way they were designed to run.',
        },
        {
          heading: 'Choosing the right type',
          body: 'Basic programmable thermostats let you set schedules for weekdays and weekends, and they work well for households with steady routines. Smart thermostats add phone control, learning schedules and energy reports, and some use remote room sensors to balance temperatures between a busy living room and a quiet bedroom. The most important factor, though, is compatibility. Heat pumps need a thermostat that handles the reversing valve and backup heat. Two-stage and variable-speed systems need one that can call for each stage. Many smart models also need a common wire for constant power, which older homes may not have.',
        },
        {
          heading: 'How installation works',
          body: 'We start by checking your existing wiring and noting what each conductor does, then confirm the new thermostat supports your equipment. If there’s no common wire, we can usually run one or add an adapter at the furnace. The new base goes on level, the wires are connected and any old wall marks are covered. Then comes the part that’s often skipped: configuration. We set the equipment type, stages, backup heat settings and fan behavior, and run the system through heating and cooling to confirm each call works. Before we go, we walk you through the controls and the schedule.',
        },
        {
          heading: 'Getting the most from your schedule',
          body: 'A thermostat only saves energy when the schedule fits your life. Setting back the temperature while everyone is asleep or away cuts run time, and the savings add up over a long Boise winter. With a heat pump, keep setbacks modest so backup heat doesn’t kick in during recovery; many smart thermostats manage this on their own. Use the vacation or hold feature rather than switching the system off, so pipes stay protected in freezing weather. If some rooms still feel uneven, remote sensors or a look at the ductwork may help more than changing the setpoint.',
        },
      ],
      faq: [
        {
          q: 'Can I install a smart thermostat myself?',
          a: 'Many people do, especially when replacing a similar model on a simple system. It gets trickier with heat pumps, multi-stage equipment, missing common wires or older line-voltage heaters. A wrong connection can damage the control board, so if the wiring doesn’t match the instructions, it’s worth having someone take a look.',
        },
        {
          q: 'Where should a thermostat be located?',
          a: 'Ideally on an interior wall in a central, frequently used room, away from direct sun, drafts, exterior doors, kitchens and supply vents. It should sit at about eye level with nothing blocking airflow around it. A poorly placed thermostat reads the wrong temperature and runs the system accordingly.',
        },
        {
          q: 'Will a smart thermostat lower my energy bills?',
          a: 'It can, but the savings depend on how it’s used. Homes where the temperature can be set back for long stretches tend to benefit most. A smart thermostat makes schedules easier to follow and adjust, and that convenience is often where the real savings come from.',
        },
      ],
    },
  ],
}
