<?php
/**
 * Static content for service and industry detail pages, keyed by slug.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

function centris_services() {
    return [
        'service-ai-call-center' => [
            'num'   => '01',
            'title' => 'AI Call Center',
            'tag'   => 'Flagship · AI',
            'lede'  => 'Where humans are powered by AI. Centris blends AI efficiency with real bilingual agents to deliver smarter, more empathetic customer care — at the speed of live conversation.',
            'bullets' => [
                'Sophia listens live to every call and surfaces the next-best line in real time.',
                'EN/ES native bilingual coverage, sub-second latency from utterance to assist.',
                'Auto-generated CRM notes — the call ends, the note is already written.',
                'Every conversation auto-scored. No sampling, no missed coaching moments.',
            ],
        ],
        'service-customer-support' => [
            'num'   => '02',
            'title' => 'Customer Support',
            'tag'   => 'Voice · Email · Chat',
            'lede'  => 'A nearshore bilingual customer contact center focused on becoming a seamless extension of your team. Voice, email, chat — same playbooks, same standards.',
            'bullets' => [
                '30+ years of bilingual contact center experience.',
                'Trained on your brand voice, your policy, your escalation paths.',
                'Same time zones as your customers, no handoff fatigue.',
                'Continuous QA on 100% of interactions, not a sample.',
            ],
        ],
        'service-bpo' => [
            'num'   => '03',
            'title' => 'Business Process Outsourcing',
            'tag'   => 'Back-office · Ops',
            'lede'  => 'Through our skilled team of agents in Mexico, we help partners gain operational efficiencies by outsourcing back-office processes to Centris.',
            'bullets' => [
                'Data entry, document review, claims processing, member services.',
                'Operates as a measured cost center with daily reporting.',
                'Native U.S. business hours coverage.',
                'Same Sophia + Live QA tooling on the back-office floor.',
            ],
        ],
        'service-inbound-sales' => [
            'num'   => '04',
            'title' => 'Inbound Sales',
            'tag'   => 'Retention · Conversion',
            'lede'  => 'Bilingual inbound sales support that increases retention, sales, and market share. Trained to qualify, recommend, and close without losing the brand voice.',
            'bullets' => [
                'Lead qualification, upsell, cross-sell, save-the-customer flows.',
                'Sophia recommends offers grounded in the customer\'s history.',
                'Compliance-aware scripting and recorded consent on every call.',
                'Outcome-based reporting — conversion, AOV, retention, churn-save.',
            ],
        ],
        'service-live-chat' => [
            'num'   => '05',
            'title' => 'Live Chat',
            'tag'   => 'Web · App · Concurrent',
            'lede'  => 'Personalized live chat that builds rapport and optimizes customer retention. Steal market share from competitors who can\'t offer the same level of bilingual care.',
            'bullets' => [
                '2–4 concurrent chats per agent with full Sophia assist.',
                'EN/ES bilingual responders, native quality on both sides.',
                'Integrated with your existing chat tooling — no rip-and-replace.',
                'Auto QA every transcript against your rubric.',
            ],
        ],
        'service-marketing-surveys' => [
            'num'   => '06',
            'title' => 'Marketing Surveys',
            'tag'   => 'Voice of Customer',
            'lede'  => 'Marketing surveys let your customers tell you exactly what they want and expect — so you can deliver fantastic performance every time.',
            'bullets' => [
                'Outbound and inbound survey programs in EN and ES.',
                'Designed with your insights team, executed at scale.',
                'Open-ended responses transcribed and themed by AI.',
                'Daily delivery of structured + qualitative findings.',
            ],
        ],
        'service-quality-assurance' => [
            'num'   => '07',
            'title' => 'Quality Assurance',
            'tag'   => 'AI · ML · 100% Coverage',
            'lede'  => 'AI-enabled QA that captures and transcribes every interaction between your customer and your agent — across all channels — and scores against your rubric.',
            'bullets' => [
                'Replaces sampling with 100% interaction coverage.',
                'Custom scorecards aligned to your brand voice and policy.',
                'Coaching insights surfaced per agent, per week, per skill.',
                'Stand-alone or paired with our customer support service.',
            ],
        ],
        'service-soft-collections' => [
            'num'   => '08',
            'title' => 'Soft Collections',
            'tag'   => 'Respectful · Compliant',
            'lede'  => 'Navigate debt recovery while maintaining positive customer relationships. A sensitive and respectful approach, bilingual by default, fully compliant.',
            'bullets' => [
                'Early-stage and pre-charge-off recovery conversations.',
                'Trained on FDCPA, TCPA, and your internal compliance program.',
                'Sophia keeps agents on-script without sounding scripted.',
                'Reporting against contact rate, RPC, PTP, and kept-payment.',
            ],
        ],
        'service-tier-1-tech' => [
            'num'   => '09',
            'title' => 'Tier 1 Tech Support',
            'tag'   => 'Triage · Escalation',
            'lede'  => 'Navigating the complexities of technical issues is daunting for customers. Tier 1 Tech Support provides a vital first line of defense.',
            'bullets' => [
                'Trained on your product, your runbooks, and your escalation model.',
                'Sophia surfaces relevant KB articles and prior tickets instantly.',
                'Clean handoffs to Tier 2 with structured context.',
                'CSAT, FCR, AHT, and ticket-quality metrics reported daily.',
            ],
        ],
    ];
}

function centris_industries() {
    return [
        'industry-insurance' => [
            'num'    => '01',
            'title'  => 'Insurance',
            'tag'    => 'Claims · Policy · Billing',
            'image'  => 'insurance.webp',
            'lede'   => 'If you\'re in an accident, filing a claim can be stressful. Our bilingual agents walk customers through the process swiftly — with AI surfacing policy details in real time.',
            'bullets' => [
                'First Notice of Loss intake, status calls, and claim escalations.',
                'Policy questions, endorsements, billing inquiries.',
                'Bilingual coverage with native EN/ES quality on both sides.',
                'Sophia keeps every conversation grounded in current policy.',
            ],
        ],
        'industry-healthcare' => [
            'num'    => '02',
            'title'  => 'Healthcare',
            'tag'    => 'HIPAA · RCM · Scheduling',
            'image'  => 'healthcare.webp',
            'lede'   => 'With more patients than ever using self-help portals, your live support matters more. Patient Advocacy, RCM, Soft Collections, Scheduling — all bilingual, all HIPAA-grade.',
            'bullets' => [
                'HIPAA-compliant intake, scheduling, and patient advocacy.',
                'Revenue Cycle Management follow-up and soft collections.',
                'Bilingual support for Hispanic patient populations.',
                'Disciplined QA against payer and provider requirements.',
            ],
        ],
        'industry-retail' => [
            'num'    => '03',
            'title'  => 'Retail & E-commerce',
            'tag'    => 'Orders · Returns · Loyalty',
            'image'  => 'retail.webp',
            'lede'   => 'Impeccable customer service across voice, live chat, and email — with AI keeping product data and order status one query away.',
            'bullets' => [
                'Order status, returns, exchanges, product Q&A.',
                'Loyalty program support and tier upgrades.',
                'Peak-season capacity that flexes up without quality loss.',
                'Multichannel coverage: voice, chat, email, social DM.',
            ],
        ],
        'industry-security' => [
            'num'    => '04',
            'title'  => 'Security',
            'tag'    => '24/7 · Triage',
            'image'  => 'security.webp',
            'lede'   => 'Peace of mind when you\'re away from home is the brand. We hold up that promise with bilingual agents trained to triage and escalate with calm precision — any time of day.',
            'bullets' => [
                '24/7/365 bilingual coverage for residential and commercial.',
                'Verified-alarm handling with calm, scripted escalation.',
                'Direct dispatch integration with local responders.',
                'Recorded, audited, and QA-scored every interaction.',
            ],
        ],
        'industry-utilities' => [
            'num'    => '05',
            'title'  => 'Utilities',
            'tag'    => 'Outages · Billing · Service',
            'image'  => 'utilities.webp',
            'lede'   => 'In utilities, reliability goes beyond electricity, water, or connectivity — it means being there when it matters most. We keep that promise live, in two languages, through outages and ordinary days alike.',
            'bullets' => [
                'Outage intake and ETR communication at scale.',
                'Billing questions, payment arrangements, new-service activation.',
                'Field-service scheduling and dispatch coordination.',
                'Surge capacity for storm response and seasonal peaks.',
            ],
        ],
        'industry-finance' => [
            'num'    => '06',
            'title'  => 'Finance',
            'tag'    => 'Verification · Servicing',
            'image'  => 'finance.webp',
            'lede'   => 'Verification, account servicing, bilingual customer care, and respectful follow-up workflows for the conversations that matter most.',
            'bullets' => [
                'Account verification, secure intake, and authentication.',
                'Servicing inquiries, balance, statement, and dispute handling.',
                'Respectful, compliant soft-collections conversations.',
                'Compliance-aware scripting and full call recording.',
            ],
        ],
    ];
}
