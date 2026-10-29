import type { QuestionGroup } from './types'

export const QUESTIONS: QuestionGroup[] = [
  {
    topic: "Hiring a lawyer",
    items: [
      { q: "How do I know if I need a lawyer?", a: "Consider a lawyer when the stakes are high, such as possible jail time, a serious injury, custody of your children, or significant money or property. You should also get help if the other side already has a lawyer or if you have received court papers with a deadline. For simple, low-stakes matters, you may be able to handle things yourself with court self-help resources." },
      { q: "What should I look for when choosing a lawyer?", a: "Look for a lawyer who regularly handles your type of matter in your state and is in good standing with the state bar. During a consultation, pay attention to whether they explain things clearly, answer your questions directly, and put their fees in writing." },
      { q: "How can I check if a lawyer is licensed?", a: "Every state has an attorney lookup run by its bar association or licensing agency. It shows whether the lawyer is licensed and in good standing, and usually lists any public discipline." },
      { q: "Can a lawyer from another state represent me?", a: "Generally, a lawyer must be licensed in the state where your case is heard. Courts can sometimes allow an out-of-state lawyer to appear in a specific case, usually alongside a local lawyer. Federal matters such as immigration have their own rules." },
      { q: "What if I cannot afford a lawyer?", a: "Contact a local legal aid organization, your state or local bar's lawyer referral service, or a law school clinic. Many lawyers offer limited-scope help for a lower cost, and if you face criminal charges that could lead to jail, you can ask the court for a public defender." },
    ],
  },
  {
    topic: "Fees & costs",
    items: [
      { q: "How do lawyers charge for their services?", a: "The most common structures are hourly billing, flat fees for defined tasks, and contingency fees, where the lawyer receives a percentage of any recovery. Many lawyers also require an upfront retainer that is drawn down as work is done." },
      { q: "What is a contingency fee?", a: "A contingency fee means the lawyer is paid a percentage of the money recovered in your case and receives no fee if there is no recovery. The agreement must be in writing. You may still be responsible for case costs, depending on the agreement." },
      { q: "What is the difference between fees and costs?", a: "Fees pay for the lawyer's work. Costs are expenses of the case itself, such as filing fees, expert witnesses, deposition transcripts, and records. Your agreement should explain who pays costs and when." },
      { q: "Do I get my retainer back if I do not use all of it?", a: "Generally, any unearned portion of a retainer held in trust must be refunded when the representation ends. Some flat fees are treated differently under state rules, so read your fee agreement and ask the lawyer to explain it." },
      { q: "What can I do if I disagree with my lawyer's bill?", a: "Start by asking the lawyer for an itemized explanation. If you cannot resolve it, many state bars offer fee dispute or fee arbitration programs that handle these disagreements." },
    ],
  },
  {
    topic: "Personal injury",
    practice: "personal-injury",
    items: [
      { q: "How long do I have to file a personal injury claim?", a: "Each state sets its own statute of limitations for injury claims, and the deadline can differ for medical malpractice, wrongful death, and claims against government entities. Claims against a government body may require a written notice within a much shorter period, so talk with a lawyer in your state promptly." },
      { q: "How much is my personal injury case worth?", a: "Value depends on factors such as the severity of your injuries, medical costs, lost income, the impact on your daily life, how clear the other party's fault is, and available insurance coverage. No one can give you a reliable figure without reviewing the details, so be wary of anyone who promises a specific amount." },
      { q: "Should I accept the insurance company's first offer?", a: "Not before you understand the full extent of your injuries and losses. Accepting a settlement usually requires signing a release that ends your claim, so you cannot ask for more later if your condition turns out to be worse." },
      { q: "What if I was partly at fault for the accident?", a: "Most states reduce your recovery by your share of fault under comparative negligence rules. Some states bar recovery if your fault reaches a certain threshold, and a few bar recovery if you were at fault at all." },
      { q: "Will my personal injury case go to trial?", a: "Most personal injury claims are resolved through settlement rather than trial. Whether yours goes to trial depends on the evidence, how far apart the parties are, and whether the insurer is willing to make a fair offer." },
    ],
  },
  {
    topic: "Criminal charges",
    practice: "criminal-defense",
    items: [
      { q: "Should I talk to the police if I have done nothing wrong?", a: "You have the right to remain silent, and it is generally wise to use it and ask for a lawyer before answering questions about a crime. Innocent people can be misunderstood or make statements that are later used against them. Invoke the right clearly by saying you will remain silent and want a lawyer." },
      { q: "What is the difference between a misdemeanor and a felony?", a: "A felony is a more serious crime that can be punished by more than a year in prison. A misdemeanor is less serious and is generally punishable by fines, probation, or up to a year in local jail. Classifications vary by state." },
      { q: "Can I get a public defender?", a: "If you are charged with a crime that could lead to jail and cannot afford a lawyer, you generally have a right to appointed counsel. The court will usually ask about your income and assets to decide whether you qualify." },
      { q: "Should I accept a plea bargain?", a: "That depends on the strength of the evidence, the possible penalties, the terms of the offer, and the long-term consequences of a conviction, including immigration effects for noncitizens. Discuss any offer with a defense lawyer before deciding, since a guilty plea is very difficult to undo." },
      { q: "Can a criminal record be cleared?", a: "Many states allow certain records to be expunged or sealed after a waiting period, particularly for arrests without conviction, dismissed charges, and some lower-level offenses. Eligibility rules vary widely by state." },
    ],
  },
  {
    topic: "Divorce & custody",
    practice: "family-law",
    items: [
      { q: "Do I have to prove my spouse did something wrong to get a divorce?", a: "No. Every state allows some form of no-fault divorce, usually based on irreconcilable differences or an irretrievable breakdown of the marriage. Some states also allow fault-based grounds, which may matter in limited situations." },
      { q: "How is property divided in a divorce?", a: "Most states divide marital property under equitable distribution, which aims for a fair division that is not necessarily equal. A smaller group of community property states generally treat property acquired during the marriage as owned equally. Property owned before the marriage may be treated as separate." },
      { q: "How do courts decide child custody?", a: "Courts decide custody based on the best interests of the child. Factors commonly include each parent's relationship with the child, stability, the child's needs, any history of abuse, and in some cases the child's own preferences. The specific factors are set by state law." },
      { q: "How is child support calculated?", a: "Each state uses its own child support guidelines, usually based on both parents' incomes, the number of children, and the parenting time arrangement. Courts can deviate from the guidelines in some circumstances." },
      { q: "Can custody or support orders be changed later?", a: "Yes. Custody and child support orders can generally be modified if there has been a significant change in circumstances, such as a job loss or relocation. You usually need to ask the court to approve the change rather than just agreeing informally." },
    ],
  },
  {
    topic: "Immigration",
    practice: "immigration",
    items: [
      { q: "Do I have a right to a free lawyer in immigration court?", a: "Generally no. You have the right to be represented in immigration court, but at no cost to the government, so you must hire a lawyer or find free help. Nonprofit organizations and accredited representatives may be able to assist." },
      { q: "Who can give me immigration legal advice?", a: "Licensed attorneys and representatives accredited by the federal government at recognized organizations can provide immigration legal help. Be cautious of notarios and immigration consultants who are not authorized, since they cannot legally represent you." },
      { q: "Can a criminal charge affect my immigration status?", a: "Yes. Many criminal convictions, and sometimes guilty pleas to minor offenses, can affect your ability to stay in or return to the United States or to become a citizen. If you are not a citizen and face criminal charges, tell your defense lawyer and consider consulting an immigration lawyer before resolving the case." },
      { q: "What should I do if I receive a Notice to Appear?", a: "A Notice to Appear starts removal proceedings in immigration court. Do not ignore it, because missing a hearing can result in an order of removal. Contact an immigration lawyer promptly and keep the court informed of your current address." },
      { q: "What can I do if my immigration application is denied?", a: "Depending on the type of application, you may be able to file a motion to reopen or reconsider, an appeal, or a new application. Deadlines for these options can be short, so review the denial notice carefully and get legal advice quickly." },
    ],
  },
  {
    topic: "Employment",
    practice: "employment-law",
    items: [
      { q: "Can my employer fire me for no reason?", a: "In most states, employment is at will, meaning an employer can end employment for any reason that is not illegal, or for no reason. An employer cannot fire you for an illegal reason, such as discrimination based on a protected characteristic or retaliation for certain protected activities. A contract or union agreement may also limit firing." },
      { q: "What counts as illegal workplace discrimination?", a: "Federal law prohibits discrimination based on characteristics such as race, color, religion, sex, national origin, age for workers 40 and older, disability, and genetic information. Many states and cities protect additional characteristics. Coverage can depend on the size of the employer." },
      { q: "How long do I have to file a discrimination complaint?", a: "Federal discrimination claims usually require filing a charge with the Equal Employment Opportunity Commission first, generally within 180 days of the discriminatory act, extended to 300 days in many states that have their own enforcement agency. State deadlines differ, so act quickly." },
      { q: "Am I entitled to overtime pay?", a: "Under federal law, many hourly and some salaried employees must be paid overtime for hours over 40 in a workweek, but certain employees are exempt based on their duties and pay. Some states have stricter overtime rules, such as daily overtime." },
      { q: "Should I sign a severance agreement?", a: "Read it carefully before signing, since severance agreements usually require you to give up legal claims against the employer. Ask how long you have to consider it and whether terms are negotiable. Workers 40 and older have specific federal protections regarding review periods when waiving age discrimination claims." },
    ],
  },
  {
    topic: "Wills & estates",
    practice: "estate-planning",
    items: [
      { q: "What happens if I die without a will?", a: "Your property passes under your state's intestacy laws, which usually favor a spouse, children, and other close relatives in a set order. A court will appoint someone to manage the estate, and you lose the ability to choose guardians for minor children or leave property to friends or charities." },
      { q: "What is the difference between a will and a living trust?", a: "A will takes effect at death and generally goes through probate. A living trust holds assets during your life and can pass them to beneficiaries without probate, but only assets actually transferred into the trust are covered. Many people use both." },
      { q: "Does a will have to be notarized?", a: "In most states a will must be signed in front of witnesses rather than notarized. Notarizing a self-proving affidavit attached to the will can make probate simpler. Requirements vary by state, and some states also recognize handwritten wills." },
      { q: "Do all assets go through probate?", a: "No. Assets with a named beneficiary, such as life insurance and retirement accounts, jointly owned property with survivorship rights, and assets held in a trust usually pass outside probate. Make sure your beneficiary designations are up to date, because they generally override your will." },
      { q: "What is a power of attorney and do I need one?", a: "A power of attorney lets someone you choose handle your financial or legal affairs if you cannot. A health care power of attorney covers medical decisions. Without these documents, your family may need to go to court to get authority to act for you." },
    ],
  },
]
