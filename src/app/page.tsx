const reports = [
  { id: "CF-0248", title: "Water leak near the library entrance", place: "Central Library · Today, 10:42 am", status: "In progress", tone: "active" },
  { id: "CF-0231", title: "Pathway light not working", place: "Gate No. 2 · 8 Oct", status: "Assigned", tone: "assigned" },
];

function Mark() {
  return <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>;
}

function Arrow() {
  return <span className="arrow-disc" aria-hidden="true">↗</span>;
}

export default function Home() {
  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="CampusFix home">
          <Mark /><span>campus<span className="brand-light">fix</span></span>
        </a>
        <div className="campus-label"><span className="live-dot" /> NIT HAMIRPUR <span className="label-divider">/</span> CAMPUS SERVICES</div>
        <a className="signin-link" href="#your-reports">Your reports <span aria-hidden="true">↗</span></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> A BETTER CAMPUS, TOGETHER</div>
          <h1>See something<br />that needs <em>fixing?</em></h1>
          <p className="hero-intro">A leaky tap. A broken light. A small issue can make a big difference to someone&apos;s day. Let the right campus team know.</p>
          <div className="trust-note"><span className="lock-icon" aria-hidden="true">⌑</span><span><strong>Your report stays private.</strong><br />Only you and the authorized campus team can see it.</span></div>
          <a className="text-link" href="#your-reports">Already reported an issue? <span>Track its progress ↗</span></a>
        </div>

        <div className="report-shell" id="report">
          <div className="report-card">
            <div className="form-heading">
              <div><span className="form-kicker">CAMPUSFIX · REPORT PREVIEW</span><h2>What needs attention?</h2></div>
              <span className="step-count">01 <i>/</i> 02</span>
            </div>
            <form>
              <label className="field-label" htmlFor="issue">Describe the issue <span>REQUIRED</span></label>
              <textarea id="issue" name="issue" placeholder="Tell us what happened and what the team should know…" rows={3} />
              <div className="field-row">
                <div className="location-field">
                  <label className="field-label" htmlFor="location">Where is it? <span>REQUIRED</span></label>
                  <div className="select-wrap"><span className="pin-icon" aria-hidden="true">⌖</span><select id="location" name="location" defaultValue=""><option value="" disabled>Select a campus area</option><option>Central Library</option><option>Admin Block</option><option>Student Activity Centre</option><option>Gate No. 1</option><option>Gate No. 2</option><option>My location isn&apos;t listed</option></select><span className="select-chevron" aria-hidden="true">⌄</span></div>
                </div>
                <div className="detail-field"><label className="field-label" htmlFor="detail">Add a detail <span>OPTIONAL</span></label><input id="detail" name="detail" placeholder="Floor, room, landmark…" /></div>
              </div>
              <div className="form-footer">
                <div className="photo-note"><span className="camera-icon" aria-hidden="true">＋</span><span><strong>Add a photo</strong><small>Optional · helps the team understand</small></span></div>
                <button className="submit-button" type="button" aria-label="Continue to sign in to submit a report">Continue <Arrow /></button>
              </div>
              <p className="signin-hint">Campus sign-in will be required before submission.</p>
            </form>
          </div>
          <div className="card-footnote"><span>01</span> REPORTS ARE REVIEWED BY AUTHORIZED CAMPUS STAFF</div>
        </div>
      </section>

      <section className="updates" id="your-reports" aria-labelledby="updates-title">
        <div className="updates-heading">
          <div><div className="eyebrow"><span className="eyebrow-line" /> KEEPING THINGS MOVING</div><h2 id="updates-title">Your campus,<br /><em>in progress.</em></h2></div>
          <p>When you report an issue, you can follow its status from your own private list. The team keeps you posted as work moves forward.</p>
        </div>
        <div className="updates-shell"><div className="updates-panel">
          <div className="panel-top"><div><span className="form-kicker">SAMPLE ACTIVITY</span><h3>Recent reports <span>02</span></h3></div><a href="#report">Start a report <span>↗</span></a></div>
          <div className="report-list">{reports.map((report) => <article className="report-row" key={report.id}>
            <span className={`status-mark ${report.tone}`} aria-hidden="true" />
            <div className="report-info"><div className="report-id">{report.id} <span>·</span> {report.place}</div><h4>{report.title}</h4></div>
            <span className={`status-pill ${report.tone}`}>{report.status}</span><span className="row-arrow" aria-hidden="true">↗</span>
          </article>)}</div>
          <div className="panel-bottom"><span><span className="privacy-dot" /> Only you can see your reports</span><span>NEW <i>→</i> ASSIGNED <i>→</i> IN PROGRESS <i>→</i> RESOLVED</span></div>
        </div></div>
      </section>

      <footer className="footer"><a className="brand" href="#top"><Mark /><span>campus<span className="brand-light">fix</span></span></a><span>Built for the NIT Hamirpur community.</span><span className="footer-note">A campus service · Not an emergency service</span></footer>
    </main>
  );
}
