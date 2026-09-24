import { Link, useParams } from 'react-router-dom';
import { ARTICLES, getArticle } from '../content/education';
import { Banner, Badge, EmptyState, PageHead } from '../components/primitives';
import { IconBook, IconChevronLeft } from '../components/icons';
import { formatDay } from '../lib/util';

export function EducationIndexPage() {
  return (
    <>
      <PageHead
        eyebrow="Learn"
        title="Education"
        lede="A small, source-backed library. Every article lists its official sources, geography, and the date the wording was last checked against those sources."
      />

      <Banner tone="info">
        General education only — not individualized medical advice. Screening guidance differs by country and personal
        circumstances.
      </Banner>

      <div className="grid-2 mt-6" style={{ gap: '1rem' }}>
        {ARTICLES.map((a) => (
          <Link key={a.slug} to={`/education/${a.slug}`} className="edu-card">
            <h3>{a.title}</h3>
            <p>{a.summary}</p>
            <div className="meta-dates" style={{ border: 0, padding: 0, marginTop: '0.85rem' }}>
              <span className="small muted">Checked {formatDay(a.reviewed)}</span>
              <span className="small muted">{a.sources.length} source{a.sources.length === 1 ? '' : 's'}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

export function EducationArticlePage() {
  const { slug } = useParams();
  const article = getArticle(slug);

  if (!article) {
    return (
      <>
        <PageHead title="Article not found" />
        <EmptyState
          title="We couldn't find that article"
          icon={<IconBook />}
          action={
            <Link to="/education" className="btn btn--primary">
              Back to Education
            </Link>
          }
        >
          The article may have been renamed. The full library is one tap away.
        </EmptyState>
      </>
    );
  }

  return (
    <article className="article">
      <Link to="/education" className="back-link">
        <IconChevronLeft /> All articles
      </Link>

      <header className="page-head">
        <div className="eyebrow">Education</div>
        <h1>{article.title}</h1>
        <p className="lede">{article.summary}</p>
      </header>

      <div className="article-body card card--pad-lg">
        {article.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="source-box">
        <h3>Sources</h3>
        <ul>
          {article.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer nofollow">
                {s.name}
              </a>
              <span className="geo">{s.geography}</span>
            </li>
          ))}
        </ul>
        <div className="meta-dates">
          <span>
            <strong>Reviewed against sources:</strong> {formatDay(article.reviewed)}
          </span>
          <span>
            <strong>Last updated:</strong> {formatDay(article.updated)}
          </span>
          <Badge tone="muted">Educational information — not your personal medical advice</Badge>
        </div>
        <p className="small muted" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
          BreastAware is not a medical publisher. Wording is checked against the linked official sources on the dates
          above; for decisions about your health, rely on the sources themselves and your healthcare professional.
        </p>
      </div>
    </article>
  );
}
