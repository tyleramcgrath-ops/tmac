import type { Guide } from './types'

export const GUIDES: Guide[] = [
  {
    slug: "how-to-choose-a-lawyer",
    title: "How to Choose the Right Lawyer",
    description: "How to find and compare lawyers: match the practice area, check licensing and discipline records, ask the right questions, and get the fee in writing.",
    category: "Hiring a Lawyer",
    answer: "To choose the right lawyer, start with someone who regularly handles your type of legal problem in your state, confirm their license and disciplinary history with the state bar, and meet with two or three candidates before deciding. Pick the one who explains your options clearly, describes the fee arrangement in writing, and communicates in a way you are comfortable with.",
    readMinutes: 7,
    sections: [
      {
        heading: "Start with the right practice area",
        paragraphs: [
          "Law is broad, and most lawyers concentrate on a handful of areas. A lawyer who spends most of their time on divorces will know local family court judges, procedures, and customs far better than a generalist who takes one family case a year.",
          "Before you search, put your problem into a category: a car accident is personal injury, a DUI arrest is criminal defense, a dispute with your employer is employment law, and so on. If your situation touches more than one area, ask candidates directly how often they handle matters like yours.",
        ],
      },
      {
        heading: "Make sure they are licensed where your case is",
        paragraphs: [
          "Lawyers are licensed state by state. For most matters you need a lawyer admitted in the state where the case will be heard or where the property, business, or dispute is located. Federal matters such as immigration or bankruptcy have their own rules about who may appear.",
          "Every state bar or attorney licensing agency offers a public lookup. Use it to confirm the lawyer is in good standing and to see whether they have any public discipline. A past reprimand is not automatically disqualifying, but you should understand what it was for.",
        ],
      },
      {
        heading: "Build a short list",
        paragraphs: [
          "Personal referrals from people who had a similar problem are valuable, as are referrals from other lawyers you trust. State and local bar associations often run lawyer referral services that screen participating lawyers and may offer a reduced-fee first consultation.",
          "Online reviews can help you spot patterns, such as repeated complaints about unreturned calls, but they rarely tell you much about legal skill. Treat them as one input among several.",
        ],
      },
      {
        heading: "Use the consultation to compare",
        paragraphs: [
          "Many lawyers offer a free or low-cost first meeting. Use it to evaluate them as much as they evaluate your case. Notice whether they listen, whether they explain things in plain language, and whether they are candid about weaknesses in your position.",
        ],
        bullets: [
          "How many matters like mine have you handled, and in which courts?",
          "Who in your office will actually work on my case day to day?",
          "What outcomes are realistic, and what are the main risks?",
          "How do you charge, and what costs am I responsible for besides your fee?",
          "How and how often will you update me, and how quickly do you return messages?",
        ],
      },
      {
        heading: "Watch for warning signs",
        paragraphs: [
          "Be cautious of any lawyer who guarantees a specific result, pressures you to sign immediately, will not put the fee arrangement in writing, or is vague about who will handle your case. Ethics rules in every state prohibit lawyers from making misleading claims about the results they can achieve.",
        ],
      },
      {
        heading: "Get the agreement in writing",
        paragraphs: [
          "Once you choose, ask for a written engagement letter or fee agreement before work begins. It should describe the scope of the work, how fees and costs are calculated and billed, and how either of you can end the relationship. Read it carefully and ask about anything you do not understand.",
        ],
      },
    ],
    faqs: [
      { q: "How many lawyers should I talk to before hiring one?", a: "Meeting with two or three is usually enough to compare experience, communication style, and fees. If your matter is urgent, such as an arrest or an approaching deadline, you may need to decide faster." },
      { q: "Is a bigger law firm always better?", a: "Not necessarily. Large firms have more resources, but a smaller firm or solo practitioner may give your case more personal attention and may cost less. What matters most is relevant experience and a good working relationship." },
      { q: "How do I check whether a lawyer has been disciplined?", a: "Use the attorney lookup on your state bar or attorney licensing agency website. It typically shows whether the lawyer is licensed, their admission date, and any public discipline." },
      { q: "Can I switch lawyers if I am unhappy?", a: "Yes. You generally have the right to end the relationship at any time, although you may owe fees for work already done, and in a pending court case the court may need to approve the change." },
    ],
    related: ["personal-injury", "criminal-defense", "family-law", "estate-planning"],
  },
  {
    slug: "how-much-does-a-lawyer-cost",
    title: "How Much Does a Lawyer Cost?",
    description: "What drives legal fees: hourly rates, flat fees, contingency fees, and retainers, plus the extra costs you may owe and how to keep the total down.",
    category: "Costs & Fees",
    answer: "What a lawyer costs depends on how they bill (hourly, flat fee, or contingency), where you live, the lawyer's experience, and how complex and contested your matter is. Simple, predictable tasks are often billed at a flat fee, injury cases are usually handled on contingency, and litigation is commonly billed by the hour, so ask for a written estimate and fee agreement before you commit.",
    readMinutes: 7,
    sections: [
      {
        heading: "The main ways lawyers charge",
        paragraphs: [
          "Most legal fees fall into one of a few structures, and many lawyers use different ones for different kinds of work.",
        ],
        bullets: [
          "Hourly: you pay for the time the lawyer and staff spend, usually tracked in small increments such as tenths of an hour.",
          "Flat fee: one set price for a defined task, common for simple wills, uncontested divorces, some criminal matters, and many immigration filings.",
          "Contingency: the lawyer is paid a percentage of any money recovered and receives no fee if there is no recovery.",
          "Retainer: an upfront deposit held in a trust account and drawn down as work is done, usually paired with hourly billing.",
          "Limited scope: you pay for help with specific parts of a matter, such as reviewing documents, while handling the rest yourself.",
        ],
      },
      {
        heading: "What drives the price",
        paragraphs: [
          "Rates vary widely by region, with large metropolitan areas generally costing more than smaller towns. A lawyer with many years of focused experience usually charges more per hour than a newer lawyer, though they may also work faster.",
          "The biggest variable is often the other side. A matter that both parties want to resolve can be handled efficiently, while a hard-fought dispute with extensive discovery, motions, and a trial can cost many times more.",
        ],
      },
      {
        heading: "Costs beyond the lawyer's fee",
        paragraphs: [
          "Your fee agreement should separate the lawyer's fees from case costs. Depending on the agreement and the type of case, you may be responsible for these costs even when the lawyer works on contingency.",
        ],
        bullets: [
          "Court filing fees and service of process",
          "Deposition transcripts and court reporters",
          "Expert witness fees",
          "Medical records, copies, and investigation expenses",
          "Mediator fees",
        ],
      },
      {
        heading: "Getting an estimate you can rely on",
        paragraphs: [
          "Ask the lawyer for a written estimate that breaks down likely costs by stage, and what could make the cost go up. Ask how often you will be billed, what the invoices will show, and whether you will be notified before the bill passes a certain amount.",
          "Ethics rules generally require that a lawyer's fee be reasonable and that the basis of the fee be communicated to you, preferably in writing. Contingency fee agreements must be in writing.",
        ],
      },
      {
        heading: "Ways to keep fees down",
        paragraphs: [
          "Organize your documents before meetings, group your questions into one email instead of several, and respond promptly to requests for information. Ask whether a paralegal can handle routine tasks at a lower rate.",
          "If cost is a serious concern, ask about limited-scope representation, or contact your state or local bar association, a legal aid organization, or a law school clinic about low-cost and free options.",
        ],
      },
    ],
    faqs: [
      { q: "Is a first consultation free?", a: "Often, but not always. Many personal injury, criminal defense, and bankruptcy lawyers offer free initial consultations, while others charge a set fee. Ask when you schedule." },
      { q: "Can I negotiate a lawyer's fee?", a: "Sometimes. Lawyers may have flexibility on rates, payment plans, retainer amounts, or the fee structure itself. It is reasonable to ask, especially before you sign the agreement." },
      { q: "What happens to unused retainer money?", a: "Money in a retainer that has not been earned generally belongs to you and must be refunded when the representation ends. Check your fee agreement for the specific terms, since some flat or earned-on-receipt fees are treated differently under state rules." },
      { q: "What if I think my bill is too high?", a: "Ask the lawyer for an itemized explanation first. If you cannot resolve it, many state bars run fee dispute or fee arbitration programs." },
    ],
    related: ["personal-injury", "family-law", "criminal-defense", "bankruptcy"],
  },
  {
    slug: "contingency-vs-hourly-fees",
    title: "Contingency vs. Hourly Fees",
    description: "How contingency and hourly fee arrangements work, which cases use each, how case costs are handled, and the questions to ask before you sign.",
    category: "Costs & Fees",
    answer: "With a contingency fee, the lawyer is paid a percentage of the money you recover and receives no fee if you recover nothing. With an hourly fee, you pay for the lawyer's time as it is spent, regardless of the outcome. Contingency is standard for personal injury and similar claims for money, while hourly billing is common for litigation, business, and family matters.",
    readMinutes: 6,
    sections: [
      {
        heading: "How a contingency fee works",
        paragraphs: [
          "In a contingency arrangement, the lawyer's fee depends on the result. If the case settles or wins at trial, the lawyer receives an agreed percentage of the recovery. If there is no recovery, you owe no attorney fee.",
          "The percentage is set out in a written agreement, which ethics rules require for contingency fees. Some agreements use a sliding scale, with a higher percentage if the case goes into litigation or to trial. Some states cap or regulate contingency percentages for certain kinds of cases, such as medical malpractice or workers' compensation.",
        ],
      },
      {
        heading: "How hourly billing works",
        paragraphs: [
          "With hourly billing, you pay for each unit of time the lawyer and staff spend on your matter, often in six-minute increments. You usually pay an upfront retainer that the lawyer draws against, and you receive periodic invoices.",
          "Hourly billing means your cost tracks the amount of work. That is fair when the scope is uncertain, but it also means the total can grow if the other side is aggressive or the matter drags on.",
        ],
      },
      {
        heading: "Which cases use which",
        paragraphs: [
          "Contingency fees are common where a case is likely to produce a sum of money: personal injury, wrongful death, medical malpractice, some employment claims, and similar cases. Ethics rules generally prohibit contingency fees in criminal defense and in most divorce, alimony, and child support matters.",
          "Hourly billing is typical for business disputes, contested family law cases, defense of lawsuits, and ongoing advice where there is no pot of money from which to pay a percentage.",
        ],
      },
      {
        heading: "Do not overlook case costs",
        paragraphs: [
          "Fees and costs are different. Costs include filing fees, expert witnesses, deposition transcripts, and records. In many contingency cases the lawyer advances these costs and is reimbursed from the recovery, but agreements differ on whether you owe costs if you lose.",
          "Also check whether the percentage is calculated before or after costs are deducted. The difference can change how much you take home, so ask the lawyer to walk you through a sample calculation.",
        ],
      },
      {
        heading: "Questions to ask before you sign",
        paragraphs: [
          "Whatever the structure, the agreement should be clear enough that you can predict how the money will be divided or billed.",
        ],
        bullets: [
          "What percentage or rate applies, and does it change at any stage?",
          "Is the percentage calculated before or after costs?",
          "Who pays case costs if there is no recovery?",
          "How will medical liens or other claims against the recovery be handled?",
          "What happens to the fee if I change lawyers or end the representation?",
        ],
      },
    ],
    faqs: [
      { q: "Is a contingency fee always cheaper?", a: "Not necessarily. You pay nothing upfront and nothing if you lose, but on a large recovery the percentage can exceed what hourly billing would have cost. The tradeoff is that the lawyer carries the risk of not being paid." },
      { q: "Can I hire a criminal defense lawyer on contingency?", a: "No. Ethics rules in every state generally prohibit contingency fees in criminal cases. Criminal defense lawyers typically charge flat fees or hourly rates." },
      { q: "Are there hybrid fee arrangements?", a: "Yes. Some lawyers use a reduced hourly rate combined with a smaller contingency percentage, or a flat fee for one stage and a different arrangement later. Any hybrid should be spelled out in writing." },
      { q: "What if my case settles quickly?", a: "Under most contingency agreements the percentage still applies to the settlement. Some agreements use a lower percentage for early resolution, so ask how timing affects the fee." },
    ],
    related: ["personal-injury", "medical-malpractice", "wrongful-death", "employment-law"],
  },
  {
    slug: "what-to-bring-to-a-lawyer-consultation",
    title: "What to Bring to Your First Lawyer Consultation",
    description: "A checklist of documents, notes, and questions to bring to a first meeting with a lawyer so you get a clear assessment of your case.",
    category: "Hiring a Lawyer",
    answer: "Bring every document related to your problem, a short written timeline of what happened, the names and contact details of everyone involved, and a list of your questions. Include anything with a deadline on it, such as court papers, notices, or letters, because the lawyer will want to check those first.",
    readMinutes: 5,
    sections: [
      {
        heading: "Why preparation matters",
        paragraphs: [
          "A first consultation is often short. The more organized you are, the more of that time the lawyer can spend assessing your case and the less they spend piecing together the facts. Preparation also helps the lawyer give you a more accurate sense of cost and strategy.",
        ],
      },
      {
        heading: "Documents to gather",
        paragraphs: [
          "Bring originals or copies of anything relevant, and do not try to decide on your own what matters. The lawyer can set aside what is not useful.",
        ],
        bullets: [
          "Court papers: summons, complaint, citation, charging documents, or orders",
          "Letters, notices, or emails from the other side, an insurer, or a government agency",
          "Contracts, leases, employment agreements, or policies",
          "Photos, videos, police or accident reports, and medical records or bills",
          "Financial records relevant to the issue, such as pay stubs or bank statements",
          "Any prior wills, trusts, or estate documents, if the matter involves an estate",
        ],
      },
      {
        heading: "Write a short timeline",
        paragraphs: [
          "A one-page timeline with dates and a sentence or two about each event helps the lawyer understand the sequence quickly. Include when you first learned about the problem, since that can affect deadlines.",
          "List the people involved, with their roles and contact information, including any witnesses, the other party, and any lawyer or insurer already involved.",
        ],
      },
      {
        heading: "Questions to bring",
        paragraphs: [
          "Write your questions down so you do not forget them in the moment.",
        ],
        bullets: [
          "What are my options, and what are the risks of each?",
          "Are there deadlines I need to know about?",
          "How would you approach my case, and how long might it take?",
          "How do you charge, and what will the likely total cost be?",
          "What should I do, or avoid doing, while the matter is pending?",
        ],
      },
      {
        heading: "Be complete and candid",
        paragraphs: [
          "Tell the lawyer the unfavorable facts as well as the favorable ones. What you say to a lawyer while seeking legal advice is generally confidential even if you do not end up hiring them, and a lawyer cannot protect you from facts they do not know about.",
        ],
      },
    ],
    faqs: [
      { q: "Should I bring originals or copies?", a: "Bring copies you can leave with the lawyer and keep the originals safe, unless the lawyer asks to see originals. Organizing them by date makes the meeting more efficient." },
      { q: "Can I bring a friend or family member?", a: "You can, but having a third party in the room may affect attorney-client privilege for what is discussed. Ask the lawyer before the meeting, especially in criminal matters." },
      { q: "What if I do not have all the documents?", a: "Bring what you have and tell the lawyer what is missing. They can often help you obtain records, and you should not delay a consultation when a deadline may be approaching." },
      { q: "Is what I tell a lawyer in a consultation confidential?", a: "Generally yes. Lawyers owe confidentiality duties to prospective clients who consult them in good faith about a legal matter, even if no lawyer-client relationship results." },
    ],
    related: ["personal-injury", "family-law", "criminal-defense", "employment-law"],
  },
  {
    slug: "do-i-need-a-lawyer",
    title: "Do I Need a Lawyer? Hiring Help vs. Representing Yourself",
    description: "When you can handle a legal matter on your own, when you should hire a lawyer, and middle-ground options like limited-scope help and legal aid.",
    category: "Hiring a Lawyer",
    answer: "You can often handle simple, low-stakes matters yourself, such as many small claims cases, uncontested name changes, or basic traffic tickets. You should strongly consider a lawyer when you face possible jail time, serious injury, the loss of custody, significant money or property, or an opponent who already has a lawyer.",
    readMinutes: 6,
    sections: [
      {
        heading: "Your right to represent yourself",
        paragraphs: [
          "In the United States you generally have the right to represent yourself in court, which is called appearing pro se. Many courts have self-help centers, standardized forms, and online guides for people without lawyers.",
          "Representing yourself means you are held to the same rules of procedure and evidence as a lawyer would be. Judges and court staff can explain procedures but cannot give you legal advice or argue your case for you.",
        ],
      },
      {
        heading: "Matters people often handle on their own",
        paragraphs: [
          "Some matters are designed to be manageable without a lawyer, particularly when the stakes are modest and the other side is cooperative.",
        ],
        bullets: [
          "Small claims cases within your state's dollar limit; some states limit or bar lawyers in small claims court",
          "Minor traffic tickets that do not carry license suspension or jail",
          "Uncontested name changes",
          "Simple uncontested divorces with no children and little property, in some states",
          "Disputing a bill or negotiating directly with a landlord or business",
        ],
      },
      {
        heading: "When you should strongly consider a lawyer",
        paragraphs: [
          "The case for hiring a lawyer gets stronger as the consequences grow and as the other side becomes more sophisticated.",
        ],
        bullets: [
          "You have been arrested or charged with a crime, including a DUI",
          "You were seriously injured or a family member died because of someone else's actions",
          "Child custody, support, or significant property is in dispute",
          "You have been sued, or the other side already has a lawyer",
          "Your immigration status is at stake",
          "You are facing bankruptcy, foreclosure, or a large tax problem",
        ],
      },
      {
        heading: "Middle-ground options",
        paragraphs: [
          "You do not have to choose between full representation and none. Many lawyers offer limited-scope representation, where they handle one piece of a matter, such as reviewing a settlement agreement, coaching you before a hearing, or drafting a single document.",
          "If cost is the obstacle, contact a legal aid organization, your state or local bar's lawyer referral service, or a law school clinic. If you are charged with a crime that could lead to jail and cannot afford a lawyer, you generally have the right to ask the court for a public defender or appointed counsel.",
        ],
      },
      {
        heading: "The cost of waiting",
        paragraphs: [
          "Legal problems often have deadlines, and missing one can end a claim or defense entirely. Even if you plan to handle a matter yourself, a single consultation early on can help you understand the deadlines and avoid mistakes that are hard to undo.",
        ],
      },
    ],
    faqs: [
      { q: "Can a judge help me if I do not have a lawyer?", a: "Judges must remain neutral, so they cannot advise you or argue your side. Many courts do offer self-help centers and staff who can explain forms and procedures." },
      { q: "Can a business represent itself in court?", a: "Generally, corporations and LLCs must be represented by a lawyer in most courts, although many states allow an owner or employee to appear for the business in small claims court." },
      { q: "Will the court appoint a lawyer for a civil case?", a: "Usually not. The right to appointed counsel applies mainly to criminal cases where jail is possible. Some states provide appointed counsel in certain civil matters, such as some child welfare cases." },
      { q: "Is it worth paying for a one-time consultation?", a: "Often it is. A single meeting can identify deadlines, defenses, and risks you might miss, and help you decide whether full representation is worth the cost." },
    ],
    related: ["criminal-defense", "family-law", "personal-injury", "bankruptcy"],
  },
  {
    slug: "mediation-vs-litigation",
    title: "Mediation vs. Litigation",
    description: "How mediation and litigation differ in cost, time, privacy, and control, and how to decide which approach fits your dispute.",
    category: "Courts & Process",
    answer: "Mediation is a voluntary, private negotiation guided by a neutral mediator who helps the parties reach their own agreement but cannot impose a decision. Litigation is the formal court process, where a judge or jury decides the outcome after both sides present evidence. Mediation is usually faster, cheaper, and more private, while litigation produces a binding decision even when the parties cannot agree.",
    readMinutes: 6,
    sections: [
      {
        heading: "What mediation is",
        paragraphs: [
          "In mediation, a trained neutral person meets with both sides, together or separately, to help them understand each other's positions and work toward a settlement. The mediator does not decide who is right. If the parties reach agreement, it is usually written down and signed, and it can become binding as a contract or court order.",
          "Mediation can happen before a lawsuit is filed or at any point during one. Many courts require or encourage mediation in certain cases, particularly family law and civil disputes, before trial.",
        ],
      },
      {
        heading: "What litigation is",
        paragraphs: [
          "Litigation is resolving a dispute through the court system. It begins with a complaint and moves through stages such as discovery, motions, and potentially trial, followed by any appeals. A judge or jury decides the outcome based on the law and the evidence.",
          "Most lawsuits settle before trial, often through negotiation or mediation along the way. Litigation and mediation are therefore not always alternatives; they frequently happen in the same case.",
        ],
      },
      {
        heading: "How they compare",
        paragraphs: [
          "Each approach has tradeoffs, and the right choice depends on your goals and your relationship with the other side.",
        ],
        bullets: [
          "Control: in mediation the parties decide the outcome; in litigation a judge or jury does.",
          "Cost and time: mediation is generally less expensive and quicker than taking a case through trial.",
          "Privacy: mediation is usually confidential; court filings and trials are generally public.",
          "Relationships: mediation tends to be less adversarial, which matters for co-parents, business partners, and neighbors.",
          "Certainty: litigation ends in a decision even if one side refuses to compromise.",
        ],
      },
      {
        heading: "When litigation may be necessary",
        paragraphs: [
          "Mediation works best when both sides are willing to negotiate in good faith. Court may be the better path when the other side will not participate, when you need an immediate court order such as a restraining order, when there is a significant imbalance of power or a history of abuse, or when you need a legal ruling that sets a precedent.",
        ],
      },
      {
        heading: "Mediation is not arbitration",
        paragraphs: [
          "People often confuse the two. In arbitration, a neutral arbitrator hears evidence and issues a decision, which is often binding and difficult to appeal. Many consumer and employment contracts contain arbitration clauses, so check any agreement you signed.",
        ],
      },
    ],
    faqs: [
      { q: "Do I need a lawyer for mediation?", a: "You are not always required to have one, but having a lawyer advise you before and during mediation, and review any agreement before you sign, helps you understand what you are giving up and gaining." },
      { q: "Is what I say in mediation confidential?", a: "Generally yes. Most states have rules that keep mediation communications confidential and inadmissible in later court proceedings, with some exceptions. Ask the mediator to explain the rules that apply." },
      { q: "What happens if mediation fails?", a: "You keep your right to go to court or continue an existing lawsuit. Even an unsuccessful mediation often narrows the issues in dispute." },
      { q: "Who pays for the mediator?", a: "Parties usually split the mediator's fee unless they agree otherwise. Some courts offer free or reduced-cost mediation programs." },
    ],
    related: ["mediation-arbitration", "family-law", "business-law", "real-estate"],
  },
  {
    slug: "what-to-do-after-a-car-accident",
    title: "What to Do After a Car Accident",
    description: "Steps to take after a car accident: safety, police reports, documenting the scene, medical care, insurance notice, and protecting a possible claim.",
    category: "After an Accident",
    answer: "After a car accident, check for injuries and call 911 if anyone is hurt, move to safety if you can, exchange information with the other drivers, and document the scene with photos. Get medical attention promptly, notify your insurer, and avoid admitting fault or giving a recorded statement to the other driver's insurer before you understand your rights.",
    readMinutes: 7,
    sections: [
      {
        heading: "At the scene",
        paragraphs: [
          "Your first priority is safety. Turn on your hazard lights, move vehicles out of traffic if they can be driven and it is safe, and check on everyone involved. Leaving the scene of an accident, especially one involving injury, can be a crime, so stay until you have exchanged information and police have released you if they respond.",
        ],
        bullets: [
          "Call 911 if anyone is injured, if a driver appears impaired, or if traffic is blocked",
          "Exchange names, phone numbers, addresses, driver's license numbers, plate numbers, and insurance details",
          "Get names and contact information for witnesses",
          "Note the time, location, weather, and road conditions",
        ],
      },
      {
        heading: "Document everything",
        paragraphs: [
          "Photograph all vehicles from several angles, the surrounding area, skid marks, traffic signals, and any visible injuries. Write down what happened while it is fresh, including what the other driver said.",
          "Ask the responding officer how to get a copy of the police report. Some states require you to report a crash to the police or the motor vehicle agency within a set time if there were injuries or damage above a certain amount, so check your state's rules.",
        ],
      },
      {
        heading: "Get medical care",
        paragraphs: [
          "Some injuries, including concussions and soft tissue injuries, may not cause symptoms right away. Getting checked promptly protects your health and creates a record linking your injuries to the crash. Follow your treatment plan and keep copies of bills and records.",
        ],
      },
      {
        heading: "Dealing with insurance",
        paragraphs: [
          "Notify your own insurer promptly, as most policies require. Stick to the facts and avoid speculating about fault. Rules for who pays first differ: some states use a no-fault system where your own personal injury protection coverage pays certain medical costs regardless of who caused the crash.",
          "You are generally not obligated to give a recorded statement to the other driver's insurer. Be cautious about signing releases or accepting a quick settlement before you know the full extent of your injuries, because a release usually ends your claim.",
        ],
      },
      {
        heading: "Protect your claim",
        paragraphs: [
          "Keep a file with the police report, photos, medical records, repair estimates, and records of missed work. Avoid posting about the accident or your injuries on social media, since insurers and opposing lawyers may review it.",
          "Every state has a deadline for filing an injury lawsuit, and claims against government entities may require a formal notice within a much shorter period. Talking with a personal injury lawyer early helps you understand those deadlines and the value of your claim.",
        ],
      },
    ],
    faqs: [
      { q: "Should I call the police for a minor accident?", a: "It is often wise, because a police report is useful evidence. Some states require a report for any accident involving injury or damage above a set amount, and police may not respond in person to every minor crash." },
      { q: "What if the other driver has no insurance?", a: "Your own uninsured or underinsured motorist coverage, if you have it, may pay for your injuries. Check your policy and tell your insurer promptly." },
      { q: "Do I need a lawyer for a car accident?", a: "For a minor fender-bender with no injuries, you may not. If you were hurt, fault is disputed, or the insurer is offering little, a consultation is worthwhile, and many injury lawyers work on contingency." },
      { q: "What if I was partly at fault?", a: "Most states let you recover reduced damages if you were partly at fault, under comparative negligence rules. A few states bar recovery if you were at fault at all, and others bar recovery beyond a certain share of fault." },
    ],
    related: ["personal-injury", "trucking-accidents", "wrongful-death", "dui-dwi"],
  },
  {
    slug: "what-to-do-if-you-are-arrested",
    title: "What to Do If You Are Arrested",
    description: "Your rights during an arrest: staying silent, asking for a lawyer, not consenting to searches, and what happens next with booking, bail, and arraignment.",
    category: "Your Rights",
    answer: "If you are arrested, stay calm, do not resist, and clearly say that you are invoking your right to remain silent and that you want a lawyer. Then stop talking about the case. Do not consent to searches, do not discuss the case with anyone but your lawyer, and contact a criminal defense lawyer or request a public defender as soon as possible.",
    readMinutes: 6,
    sections: [
      {
        heading: "During the arrest",
        paragraphs: [
          "Do not run, resist, or argue, even if you believe the arrest is unfair. Keep your hands visible and follow lawful instructions. You can challenge the arrest later in court with a lawyer, but physical resistance can lead to additional charges and danger.",
          "You may be asked for identification. Whether you must provide your name depends on your state's law and the circumstances, but beyond basic identifying information you are generally not required to answer questions.",
        ],
      },
      {
        heading: "Use your right to remain silent",
        paragraphs: [
          "The Fifth Amendment protects you from being compelled to incriminate yourself. Staying quiet is not enough on its own; courts have held that you should invoke the right clearly. Say something like: I am going to remain silent, and I want to speak with a lawyer.",
          "Once you ask for a lawyer, police should stop questioning you. Do not try to explain your side, talk your way out of the arrest, or answer casual questions. Anything you say, including to cellmates or on recorded jail phone calls, can be used as evidence.",
        ],
      },
      {
        heading: "Do not consent to searches",
        paragraphs: [
          "You can say that you do not consent to a search of your person, car, home, or phone. Police may still search if they have a warrant or a legal exception applies, but do not physically interfere. Your refusal preserves your lawyer's ability to challenge the search later.",
        ],
      },
      {
        heading: "What happens next",
        paragraphs: [
          "After an arrest you are typically booked, which includes fingerprints, photographs, and recording personal information. Depending on the charge and local rules, you may be released with a citation, released after posting bail, or held until a judge sets bail or release conditions.",
          "Your first court appearance, often called an arraignment, is where you are told the charges and usually enter a plea. If you cannot afford a lawyer and face possible jail time, you can ask the court to appoint a public defender.",
        ],
        bullets: [
          "Ask for a lawyer before any questioning",
          "Make a phone call to family or a lawyer if allowed, and assume it may be recorded",
          "Do not sign statements or documents you do not understand",
          "Write down what happened as soon as you can, and share it only with your lawyer",
        ],
      },
      {
        heading: "Contacting a defense lawyer",
        paragraphs: [
          "Early involvement by a defense lawyer can affect bail, protect your rights during any further questioning, and preserve evidence. A family member can contact a lawyer on your behalf while you are in custody.",
        ],
      },
    ],
    faqs: [
      { q: "Do police have to read me my Miranda rights?", a: "Miranda warnings are required before custodial interrogation, meaning questioning while you are in custody. If police do not question you, they may not need to read them, and a missing warning does not automatically end a case." },
      { q: "Can I talk my way out of being charged?", a: "Rarely. Statements made to explain yourself are a common source of evidence against defendants. Let your lawyer decide whether and how to communicate with police or prosecutors." },
      { q: "How does bail work?", a: "Bail is money or a promise that helps ensure you return to court. A judge sets it based on factors such as the charge, your record, and your ties to the community, and bail practices vary significantly by state." },
      { q: "Will I get a public defender?", a: "If you are charged with a crime that could result in jail and cannot afford a lawyer, you generally have a right to appointed counsel. You will usually be asked about your finances to determine eligibility." },
    ],
    related: ["criminal-defense", "dui-dwi", "immigration"],
  },
  {
    slug: "statute-of-limitations-explained",
    title: "Statute of Limitations, Explained",
    description: "What a statute of limitations is, why deadlines vary by state and claim type, when the clock starts, and what can pause or shorten it.",
    category: "Courts & Process",
    answer: "A statute of limitations is a law that sets the deadline for filing a lawsuit or bringing criminal charges. Once it passes, the claim is usually barred for good. The deadline varies by state and by the type of claim, so the only reliable way to know yours is to check the specific law that applies or ask a lawyer licensed in your state.",
    readMinutes: 6,
    sections: [
      {
        heading: "What a statute of limitations does",
        paragraphs: [
          "Statutes of limitations set time limits for legal action. They exist so that cases are decided while evidence is reasonably fresh and so that people are not exposed to lawsuits indefinitely.",
          "In civil cases, if you file after the deadline, the defendant can ask the court to dismiss the case, and the court will usually do so. In criminal cases, the deadline limits how long the government has to bring charges, although the most serious crimes, such as murder, often have no limit at all.",
        ],
      },
      {
        heading: "Why the deadline varies",
        paragraphs: [
          "There is no single national deadline. Each state sets its own limitation periods, and federal law sets others for federal claims. Within a single state, the deadline can differ a great deal depending on the claim.",
        ],
        bullets: [
          "Personal injury and wrongful death",
          "Medical malpractice, which often has its own special rules",
          "Breach of a written contract versus an oral contract",
          "Property damage",
          "Employment discrimination, which may require filing an administrative charge with an agency before any lawsuit",
          "Claims against government entities",
        ],
      },
      {
        heading: "When the clock starts",
        paragraphs: [
          "The limitation period usually begins when the claim arises, such as the date of an accident or a breach. For some claims, many states apply a discovery rule, which starts the clock when you discovered, or reasonably should have discovered, the injury and its cause.",
          "Determining the start date can be complicated, especially for injuries that develop slowly, professional errors that are not obvious, or fraud that was concealed.",
        ],
      },
      {
        heading: "What can pause or shorten the clock",
        paragraphs: [
          "Some circumstances can pause, or toll, the limitation period. Common examples include the injured person being a minor, certain kinds of legal incapacity, or the defendant being absent from the state, though the rules differ by jurisdiction.",
          "Other rules can effectively shorten your time. Claims against cities, counties, states, and federal agencies often require a written notice of claim within a short period, well before the general lawsuit deadline. Contracts and insurance policies may also contain their own time limits.",
        ],
      },
      {
        heading: "Statutes of repose",
        paragraphs: [
          "Some states also have statutes of repose, which set an outer limit measured from a fixed event, such as when a product was sold or construction was completed, regardless of when the injury was discovered. These can bar a claim even if the discovery rule would otherwise allow it.",
        ],
      },
      {
        heading: "Do not wait to find out",
        paragraphs: [
          "Because the deadline depends on your state, your claim type, and the specific facts, it is risky to rely on general information or a figure you found online. If you think you may have a claim, talk with a lawyer promptly. Lawyers also need time to investigate before filing, so contacting one close to the deadline can limit your options.",
        ],
      },
    ],
    faqs: [
      { q: "What happens if I miss the statute of limitations?", a: "In most cases the claim is permanently barred, and the court will dismiss it if the defendant raises the deadline. Exceptions are narrow, so do not count on one applying." },
      { q: "Does negotiating with an insurer stop the clock?", a: "Generally no. Settlement talks usually do not pause the statute of limitations unless there is a written agreement to extend it or a specific rule applies. Filing the lawsuit is what typically preserves the claim." },
      { q: "Do crimes have statutes of limitations?", a: "Many do, and the periods vary by state and offense. The most serious crimes, such as murder, typically have no limitation period." },
      { q: "Is the deadline the same in every state?", a: "No. Each state sets its own deadlines, and they differ by claim type. Federal claims have their own deadlines as well." },
    ],
    related: ["personal-injury", "medical-malpractice", "wrongful-death", "employment-law"],
  },
  {
    slug: "attorney-client-privilege",
    title: "How Attorney-Client Privilege Works",
    description: "What attorney-client privilege protects, who it covers, how it can be waived, its main exceptions, and how it differs from a lawyer's duty of confidentiality.",
    category: "Your Rights",
    answer: "Attorney-client privilege protects confidential communications between you and your lawyer made for the purpose of getting legal advice, so neither you nor your lawyer can generally be forced to disclose them. The privilege belongs to you as the client, it can be lost if you share the communication with outsiders, and it does not cover communications made to further a future crime or fraud.",
    readMinutes: 6,
    sections: [
      {
        heading: "What the privilege protects",
        paragraphs: [
          "The attorney-client privilege is a rule of evidence. It allows you to refuse to disclose, and to prevent your lawyer from disclosing, confidential communications made between you and your lawyer for the purpose of seeking or providing legal advice.",
          "The privilege protects communications, not underlying facts. If you witnessed an event, you can still be asked what you saw, even though what you told your lawyer about it remains protected. Likewise, handing a pre-existing document to your lawyer does not make the document itself privileged.",
        ],
      },
      {
        heading: "The basic requirements",
        paragraphs: [
          "Details vary by state and in federal court, but the privilege generally applies when these elements are present.",
        ],
        bullets: [
          "A communication between a client, or prospective client, and a lawyer",
          "Made in confidence, without unnecessary third parties present",
          "For the purpose of obtaining or providing legal advice, not business or personal advice",
        ],
      },
      {
        heading: "How the privilege can be waived",
        paragraphs: [
          "Because the privilege belongs to you, you can waive it, sometimes without meaning to. Sharing your lawyer's advice with friends, family, or on social media can waive protection for that communication. Having non-essential third parties present during a meeting can mean the privilege never attaches.",
          "People who help the lawyer provide legal services, such as paralegals, assistants, and sometimes interpreters or consultants retained by the lawyer, generally do not break the privilege.",
        ],
      },
      {
        heading: "Important exceptions",
        paragraphs: [
          "The privilege is strong but not absolute. The most significant exception is the crime-fraud exception: communications made to get help committing or covering up a future crime or fraud are not protected. Asking a lawyer about a past act, by contrast, is the core of what the privilege protects.",
          "Other exceptions can arise in disputes between the lawyer and client, such as a fee dispute or malpractice claim, and in some situations involving joint clients who later become adversaries.",
        ],
      },
      {
        heading: "Privilege vs. confidentiality",
        paragraphs: [
          "Lawyers also have a broader ethical duty of confidentiality. It covers essentially all information relating to your representation, from any source, not just your communications. The privilege determines what can be compelled in court, while the duty of confidentiality governs what your lawyer may voluntarily reveal. State ethics rules allow limited exceptions, such as preventing certain serious harms.",
        ],
      },
      {
        heading: "Practical tips",
        paragraphs: [
          "Avoid discussing your case with anyone other than your lawyer, and do not forward your lawyer's emails. Be careful using an employer's email or devices, since some courts have found that employees had no expectation of privacy in work accounts.",
        ],
      },
    ],
    faqs: [
      { q: "Does the privilege apply if I do not hire the lawyer?", a: "Generally yes. Communications with a lawyer during a consultation about possibly hiring them are usually protected, even if you never retain them." },
      { q: "Does the privilege end when the case ends?", a: "No. The privilege generally continues after the representation ends, and in many circumstances even after the client's death." },
      { q: "Can my lawyer be forced to testify against me?", a: "Not about privileged communications, unless an exception applies or you have waived the privilege. Your lawyer may still be required to testify about non-privileged matters in limited circumstances." },
      { q: "Are communications with a company's lawyer privileged for employees?", a: "A company's lawyer represents the company, not individual employees. The company holds the privilege and can choose to waive it, so an employee may need separate counsel." },
    ],
    related: ["criminal-defense", "business-law", "employment-law", "family-law"],
  },
]
