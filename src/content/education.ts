/** Education library — small, source-backed, non-prescriptive (§17, §44).
 *
 * Every article links an official/authoritative source that was opened and
 * verified during the build. Reviewed dates record when the wording was last
 * checked against the linked source — not an independent clinical review.
 * Content is general and educational; screening guidance differs by country
 * and by personal circumstances. */

export interface EducationArticle {
  slug: string;
  title: string;
  summary: string;
  body: string[];
  sources: Array<{ name: string; url: string; geography: string }>;
  reviewed: string; // ISO date
  updated: string; // ISO date
}

export const EDUCATION_REVIEWED = '2026-09-23';

export const ARTICLES: EducationArticle[] = [
  {
    slug: 'breast-self-awareness',
    title: 'Breast self-awareness',
    summary: 'Learn what is usual for you, so a real change is easier to notice and describe.',
    body: [
      'Breast self-awareness means being familiar with how your breasts normally look and feel — for you. Breasts differ from person to person and often feel lumpy or uneven. What is usual for one person may not be usual for another.',
      'Health authorities describe normal variation as wide: appearance and feel can be affected by your menstrual cycle, pregnancy, weight change, medication, and age.',
      'BreastAware supports this by helping you write down your personal baseline in My Normal and record anything you notice over time. Writing things down is a documentation habit, not a medical examination, and completing notes in this app does not replace any recommended screening or a clinical examination.',
      'If you notice a new or changing concern, consider discussing it with a healthcare professional.',
    ],
    sources: [
      {
        name: 'CDC — Symptoms of Breast Cancer (incl. “What is a normal breast?”)',
        url: 'https://www.cdc.gov/breast-cancer/symptoms/index.html',
        geography: 'United States',
      },
      {
        name: 'NHS — How to check your breasts or chest',
        url: 'https://www.nhs.uk/tests-and-treatments/how-to-check-your-breasts-or-chest/',
        geography: 'United Kingdom',
      },
    ],
    reviewed: EDUCATION_REVIEWED,
    updated: EDUCATION_REVIEWED,
  },
  {
    slug: 'understanding-changes',
    title: 'Understanding changes',
    summary: 'Changes come in many forms. Most are not caused by cancer, but new changes deserve attention.',
    body: [
      'People notice many kinds of breast changes: lumps or thickening, skin dimpling or redness, nipple changes or discharge, pain, and changes in size or shape.',
      'Official sources note that most breast lumps are caused by non-cancerous conditions — for example fibrocystic changes or cysts — while some changes do need to be checked. Only a healthcare professional can determine what a change means for you.',
      'BreastAware never interprets what a change is. Its job is to help you capture what you noticed, where, and when, so you can describe it clearly.',
      'Keep in mind that normal breasts often feel uneven, and that cycle-related tenderness or lumpiness is commonly reported. A change that is new or different for you is worth noting and, if it persists or worries you, discussing with a healthcare professional.',
    ],
    sources: [
      {
        name: 'National Cancer Institute — Understanding Breast Changes and Conditions (PDF)',
        url: 'https://www.cancer.gov/types/breast/breast-changes/understanding-breast-changes.pdf',
        geography: 'United States',
      },
      {
        name: 'CDC — Symptoms of Breast Cancer',
        url: 'https://www.cdc.gov/breast-cancer/symptoms/index.html',
        geography: 'United States',
      },
    ],
    reviewed: EDUCATION_REVIEWED,
    updated: EDUCATION_REVIEWED,
  },
  {
    slug: 'noticing-a-change',
    title: 'What to do when you notice a change',
    summary: 'Record it while it is fresh, then decide with a professional — not an app — what it means.',
    body: [
      'When you notice something new, write it down promptly: what you noticed, which side, the approximate area, and the date you first saw or felt it. Memory fades; organised notes do not.',
      'Health authorities advise seeing a doctor without delay about new or unusual changes so they can be checked. You do not need to wait for a scheduled screening appointment to raise a concern.',
      'In BreastAware this maps to Record a Change → Body Map marker → My Timeline. Add any questions you think of while they are fresh.',
      'BreastAware cannot tell you whether a change is harmful or harmless. The purpose of recording is to support a conversation with a qualified healthcare professional who can examine and, if needed, investigate.',
      'If a change is rapid, severe, or you feel unwell, contact a healthcare service promptly rather than waiting on an app.',
    ],
    sources: [
      {
        name: 'Cancer Council Australia — Early detection of breast cancer',
        url: 'https://www.cancer.org.au/cancer-information/causes-and-prevention/early-detection-and-screening/early-detection-of-breast-cancer',
        geography: 'Australia',
      },
      {
        name: 'NHS — How to check your breasts or chest',
        url: 'https://www.nhs.uk/tests-and-treatments/how-to-check-your-breasts-or-chest/',
        geography: 'United Kingdom',
      },
    ],
    reviewed: EDUCATION_REVIEWED,
    updated: EDUCATION_REVIEWED,
  },
  {
    slug: 'preparing-for-a-visit',
    title: 'Preparing for a healthcare visit',
    summary: 'A short, organised brief beats a nervous memory. Bring the facts you gathered.',
    body: [
      'Appointments are short. Patients who arrive with written notes tend to cover what matters to them and leave with clearer next steps.',
      'A useful brief includes: why you are going, what you noticed and when, the questions you want answered, relevant history, medications and supplements, and any recent screening records.',
      'National Cancer Institute materials are explicitly written to help people talk with their doctor or nurse about breast changes and next steps — preparation for conversation is an established part of care, not a substitute for it.',
      'In BreastAware, Prepare for a Visit walks through these sections, and Create My Health Summary turns them into one printable page. The summary contains only what you entered — it never invents medical content.',
    ],
    sources: [
      {
        name: 'National Cancer Institute — Understanding Breast Changes and Conditions (PDF)',
        url: 'https://www.cancer.gov/types/breast/breast-changes/understanding-breast-changes.pdf',
        geography: 'United States',
      },
    ],
    reviewed: EDUCATION_REVIEWED,
    updated: EDUCATION_REVIEWED,
  },
  {
    slug: 'screening-basics',
    title: 'Screening basics',
    summary: 'Screening programs differ by country and personal circumstances — check local guidance.',
    body: [
      'Breast screening (most often mammography) is offered to people without symptoms through national or regional programs. Screening schedules, age ranges, and invitations differ significantly between countries and can change over time.',
      'Because guidance varies, BreastAware never tells you which screening you need or when. Screening & Appointments is a personal record-keeping tool only.',
      'Examples of official programs (current at the reviewed date): the United States CDC describes mammogram recommendations; the NHS runs the UK breast screening program; BreastScreen Australia offers free mammograms; Health New Zealand runs BreastScreen Aotearoa; Canada’s programs are organised province by province.',
      'If you have symptoms or a concern, that is a diagnostic conversation with a healthcare professional — screening programs are for people without symptoms.',
      'For what applies to you, check current guidance from your healthcare professional or your local screening program.',
    ],
    sources: [
      {
        name: 'CDC — Screening for Breast Cancer',
        url: 'https://www.cdc.gov/breast-cancer/screening/',
        geography: 'United States',
      },
      {
        name: 'Health New Zealand — BreastScreen Aotearoa Programme',
        url: 'https://www.healthnz.govt.nz/about-us/what-we-do/programmes-and-initiatives/breastscreen-aotearoa-programme',
        geography: 'New Zealand',
      },
      {
        name: 'Australian Government Department of Health — BreastScreen Australia Program',
        url: 'https://www.health.gov.au/our-work/breastscreen-australia-program',
        geography: 'Australia',
      },
      {
        name: 'Breast Cancer Canada — Screening guidelines',
        url: 'https://breastcancer.ca/screening-guidelines/',
        geography: 'Canada',
      },
    ],
    reviewed: EDUCATION_REVIEWED,
    updated: EDUCATION_REVIEWED,
  },
  {
    slug: 'questions-to-ask',
    title: 'Questions to ask',
    summary: 'Write questions down before you arrive. Mark the ones that matter most.',
    body: [
      'Questions you might consider asking a healthcare professional about a breast change include: What could be causing this? Would you like to examine it? Do I need any tests? What should I watch for? When should I come back?',
      'For screening you might ask: Which screening program applies to me here? Am I due? What happens if a result is unclear?',
      'Only you can decide which questions matter. BreastAware’s Questions list lets you create, prioritise, mark discussed or answered, and include or exclude each question from your visit summary.',
      'The app organises your questions — it does not answer them. Answers should come from a qualified healthcare professional who can consider your situation.',
    ],
    sources: [
      {
        name: 'National Cancer Institute — Understanding Breast Changes and Conditions (PDF)',
        url: 'https://www.cancer.gov/types/breast/breast-changes/understanding-breast-changes.pdf',
        geography: 'United States',
      },
      {
        name: 'Cancer Council Australia — Early detection of breast cancer',
        url: 'https://www.cancer.org.au/cancer-information/causes-and-prevention/early-detection-and-screening/early-detection-of-breast-cancer',
        geography: 'Australia',
      },
    ],
    reviewed: EDUCATION_REVIEWED,
    updated: EDUCATION_REVIEWED,
  },
  {
    slug: 'common-breast-changes',
    title: 'Common breast changes',
    summary: 'An overview of the kinds of changes people notice — with honest limits on what an app can say.',
    body: [
      'Changes people commonly report include: lumpiness or a distinct lump, tenderness or pain (often cycle-related), changes in size or shape, skin dimpling or redness, nipple retraction or discharge, and changes that come and go with the menstrual cycle.',
      'CDC notes that many breast lumps are caused by other medical conditions, such as fibrocystic changes or fluid-filled cysts — and also that some changes can be signs of cancer, which is why new changes should be checked rather than guessed at.',
      'Normal variation includes breasts that feel different from each other or change over decades of life.',
      'This article is general education, not a catalogue for self-diagnosis. BreastAware deliberately has no symptom checker, no risk score, and no “probability” field — nothing in this app can classify what a change is.',
      'Record what you notice, and take new or persistent changes to a healthcare professional.',
    ],
    sources: [
      {
        name: 'CDC — Symptoms of Breast Cancer',
        url: 'https://www.cdc.gov/breast-cancer/symptoms/index.html',
        geography: 'United States',
      },
      {
        name: 'National Cancer Institute — Understanding Breast Changes and Conditions (PDF)',
        url: 'https://www.cancer.gov/types/breast/breast-changes/understanding-breast-changes.pdf',
        geography: 'United States',
      },
    ],
    reviewed: EDUCATION_REVIEWED,
    updated: EDUCATION_REVIEWED,
  },
  {
    slug: 'privacy-and-health-information',
    title: 'Privacy and personal health information',
    summary: 'Where your data lives, who can see it, and how health information privacy works elsewhere.',
    body: [
      'BreastAware stores your records only in this browser on this device, encrypted at rest with a key derived from your passcode. There is no BreastAware server holding your health information, no analytics receiving it, and your notes never appear in URLs.',
      'You can export everything you own (including documents) as a JSON file, or delete all of it permanently from Privacy & Settings. If you clear your browser data, the encrypted vault is removed — keep an export if you want a copy.',
      'Clearing browser data or forgetting your passcode cannot be undone: the passcode is never transmitted anywhere, so it cannot be recovered. This is the cost of a truly local design; an export before you need it is your safety net.',
      'In many countries, health information held by providers has specific legal protections. In the United States, for example, HIPAA gives individuals rights over medical records held by covered providers and plans — that law governs those organisations, not this app.',
      'Privacy claims in BreastAware describe only what the code does. If a feature is not implemented, it is not promised.',
    ],
    sources: [
      {
        name: 'U.S. HHS — Your Medical Records (HIPAA access rights)',
        url: 'https://www.hhs.gov/hipaa/for-individuals/medical-records/index.html',
        geography: 'United States',
      },
    ],
    reviewed: EDUCATION_REVIEWED,
    updated: EDUCATION_REVIEWED,
  },
];

export function getArticle(slug: string | undefined): EducationArticle | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
