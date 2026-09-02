import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatReason(value) {
  return String(value || "unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function App() {
  // =========================================================
  // CORE STATE
  // =========================================================

  const [metrics, setMetrics] = useState(null);
  const [failureIntel, setFailureIntel] = useState(null);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [error, setError] = useState(null);

  const [incidentSimulation, setIncidentSimulation] = useState(null);
  const [isIncidentSimulating, setIsIncidentSimulating] = useState(false);
  // =========================================================
  // RUN RECOVERY
  // =========================================================

  const [isRunning, setIsRunning] = useState(false);
  const [runMessage, setRunMessage] = useState("");

  // =========================================================
  // SEARCH / FILTER
  // =========================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [incidentMode, setIncidentMode] = useState(false);
  
  const [playbookResult, setPlaybookResult] = useState(null);
  const [isSimulatingPlaybook, setIsSimulatingPlaybook] = useState(false);
  // =========================================================
  // STRATEGY LAB
  // =========================================================

  const [strategy, setStrategy] = useState("BALANCED");
  const [strategyResult, setStrategyResult] = useState(null);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [simAmount, setSimAmount] = useState(4999);
  const [simFailure, setSimFailure] = useState("network_error");
  const [simAttempts, setSimAttempts] = useState(1);
  const [simCustomer, setSimCustomer] = useState("returning");
  const [simulation, setSimulation] = useState(null);

  // =========================================================
  // LOAD METRICS
  // =========================================================

  const loadMetrics = async () => {
    try {
      setError(null);

      const response = await fetch(`${API_BASE}/api/metrics`);

      if (!response.ok) {
        throw new Error(
          `Backend returned status ${response.status}`
        );
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  // =========================================================
  // LOAD FAILURE INTELLIGENCE
  // =========================================================

  const loadFailureIntelligence = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/failure-intelligence`
      );

      if (!response.ok) {
        throw new Error(
          `Failure intelligence returned ${response.status}`
        );
      }

      const data = await response.json();
      setFailureIntel(data);
    } catch (err) {
      console.error(err);
    }
  };

  // =========================================================
  // LOAD EVERYTHING
  // =========================================================

  useEffect(() => {
    loadMetrics();
    loadFailureIntelligence();
  }, []);

  const simulateIncidentPlaybook = async () => {
    setIsIncidentSimulating(true);
    setIncidentSimulation(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/strategy-simulation?strategy=BALANCED`
      );

      if (!response.ok) {
        throw new Error(
          `Simulation failed with status ${response.status}`
        );
      }

      const data = await response.json();
      setIncidentSimulation(data);
    } catch (err) {
      console.error("Incident simulation error:", err);
    } finally {
      setIsIncidentSimulating(false);
    }
  };
  const simulatePlaybook = async () => {
    setIsSimulatingPlaybook(true);
    setPlaybookResult(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/strategy-simulation?strategy=BALANCED`
      );

      if (!response.ok) {
        throw new Error(
          `Simulation failed with status ${response.status}`
        );
      }

      const data = await response.json();
      setPlaybookResult(data);
    } catch (err) {
      console.error("Playbook simulation failed:", err);
    } finally {
      setIsSimulatingPlaybook(false);
    }
  };
  // =========================================================
  // RUN RECOVERY
  // =========================================================

  const runRecovery = async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    setIsRunning(true);
    setRunMessage("");
    setError(null);

    try {
      // Stage 1 — Analyze
      setRunMessage("ANALYZING FAILED PAYMENTS...");
      await wait(650);

      // Stage 2 — Classify
      setRunMessage("CLASSIFYING FAILURE PATTERNS...");
      await wait(650);

      // Stage 3 — AI decision
      setRunMessage("APPLYING AI RECOVERY POLICY...");
      await wait(650);

      // Stage 4 — Guardrails
      setRunMessage("RUNNING RECOVERY GUARDRAILS...");
      await wait(650);

      // Stage 5 — Execute actual backend pipeline
      setRunMessage("SIMULATING RECOVERY OUTCOMES...");

      const response = await fetch(
        `${API_BASE}/api/run-recovery`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const body = await response.text();

        throw new Error(
          `Recovery failed (${response.status})${body ? `: ${body}` : ""}`
        );
      }

      const data = await response.json();

      // Refresh the real backend-derived metrics
      await loadMetrics();
      await loadFailureIntelligence();

      // Reset strategy comparison after a new simulation
      setStrategyResult(null);

      // Final stage
      setRunMessage(
        data.message || "RECOVERY PIPELINE COMPLETED"
      );

      await wait(500);

      setRunMessage("✓ RECOVERY COMPLETE");
    } catch (err) {
      console.error(err);

      setError(err.message);
      setRunMessage("");
    } finally {
      setIsRunning(false);
    }
  };

  // =========================================================
  // STRATEGY SIMULATION
  // =========================================================

  const simulateStrategy = async () => {
    setStrategyLoading(true);
    setStrategyResult(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/strategy-simulation?strategy=${strategy}`
      );

      if (!response.ok) {
        throw new Error(
          `Strategy simulation failed (${response.status})`
        );
      }

      const data = await response.json();

      setStrategyResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setStrategyLoading(false);
    }
  };
  const runDecisionSimulation = async () => {
  setSimulation(null);
  setError(null);

  try {
    const params = new URLSearchParams({
      amount: String(simAmount),
      failure_reason: simFailure,
      attempts: String(simAttempts),
      customer_type: simCustomer,
    });

    const response = await fetch(
      `${API_BASE}/api/decision-simulator?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(
        `Decision simulator failed (${response.status})`
      );
    }

    const data = await response.json();

    setSimulation({
      recommendation: data.ai_recommendation,
      riskScore: data.risk_score,
      guardrail: data.guardrail,
      finalAction: data.final_action,
      recoveryProbability:
        data.recovery_probability,
      estimatedRecovery:
        data.estimated_recovery,
      explanation: data.explanation,
      guardrailChecks:
        data.guardrail_checks || [],
      riskAdjustments:
        data.risk_adjustments || [],
    });
  } catch (err) {
    console.error(err);
    setError(err.message);
  }
};

  // =========================================================
  // FILTER TRANSACTIONS
  // =========================================================

  const filteredDecisions = useMemo(() => {
    const decisions = metrics?.recent_decisions || [];

    const search = searchTerm.trim().toLowerCase();

    return decisions.filter((item) => {
      const transactionId = String(
        item.transaction_id || ""
      ).toLowerCase();

      const action = String(
        item.action || ""
      ).toUpperCase();

      const outcome = String(
        item.outcome || ""
      ).toUpperCase();

      const matchesSearch =
        !search ||
        transactionId.includes(search);

      const matchesStatus =
        statusFilter === "ALL" ||
        action === statusFilter ||
        outcome === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    metrics,
    searchTerm,
    statusFilter,
  ]);

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (!metrics && !error) {
    return (
      <div className="app">
        <main className="container">
          <section className="panel">
            <div className="loading-state">
              <p className="eyebrow">
                RECORVAI SYSTEM
              </p>

              <h1>Loading recovery intelligence...</h1>

              <p>
                Connecting to the RecoverAI decision engine.
              </p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // =========================================================
  // ERROR STATE
  // =========================================================

  if (error && !metrics) {
    return (
      <div className="app">
        <main className="container">
          <section className="panel">
            <div className="loading-state">
              <p className="eyebrow">
                CONNECTION ERROR
              </p>

              <h1>RecoverAI</h1>

              <p>{error}</p>

              <button
                className="run-button"
                onClick={() => {
                  loadMetrics();
                  loadFailureIntelligence();
                }}
              >
                RETRY CONNECTION
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // =========================================================
  // SAFE METRIC VALUES
  // =========================================================

  const recoveryRate = Number(
    metrics?.recovery_rate || 0
  );

  const recoveredRevenue = Number(
    metrics?.recovered_revenue || 0
  );

  const recoverableRevenue = Number(
    metrics?.estimated_recoverable_revenue || 0
  );

  const revenueAtRisk = Number(
    metrics?.revenue_at_risk || 0
  );

  const failedTransactions = Number(
    metrics?.failed_transactions || 0
  );

  const totalTransactions = Number(
    metrics?.total_transactions || 0
  );

  const guardrailOverrides = Number(
    metrics?.guardrail_overrides || 0
  );

  const retryCount = Number(
    metrics?.retry || 0
  );

  const reminderCount = Number(
    metrics?.reminder || 0
  );

  const escalateCount = Number(
    metrics?.escalate || 0
  );

  const missedOpportunity = Number(
    failureIntel?.missed_opportunity || 0
  );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="app">
      <nav className="main-nav">

    <div className="nav-brand">
      <div className="nav-logo">R</div>

      <div>
        <strong>RecoverAI</strong>
        <span>Recovery Operations</span>
      </div>
    </div>

    <div className="nav-links">
      <a href="#overview">Overview</a>
      <a href="#intelligence">Intelligence</a>
      <button
  type="button"
  className="nav-link-button"
  onClick={() => {
    setIncidentMode(true);

    setTimeout(() => {
      document
        .getElementById("incident")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }}
>
  Incident
</button>
      <a href="#strategy">Simulator</a>
      <a href="#audit">Audit</a>
    </div>

    <div className="nav-status">
      <span></span>
      SYSTEM ACTIVE
    </div>

  </nav>
  <div className="system-health-bar">

  <div className="health-label">
    <span className="health-pulse"></span>

    <div>
      <strong>DECISION HEALTH</strong>
      <small>Recovery engine status</small>
    </div>
  </div>

  <div className="health-status">
    <span
      className={
        Number(metrics?.guardrail_overrides ?? 0) >= 20
          ? "health-indicator warning"
          : Number(metrics?.recovery_rate ?? 0) >= 60
            ? "health-indicator healthy"
            : "health-indicator attention"
      }
    ></span>

    <strong>
      {Number(metrics?.guardrail_overrides ?? 0) >= 20
        ? "HUMAN REVIEW"
        : Number(metrics?.recovery_rate ?? 0) >= 60
          ? "HEALTHY"
          : "ATTENTION"}
    </strong>

    <span className="health-divider"></span>

    <span>
      Recovery {Number(metrics?.recovery_rate ?? 0).toFixed(2)}%
    </span>

    <span>
      Guardrails {metrics?.guardrail_overrides ?? 0}
    </span>
  </div>

</div>
<div className="operator-focus">

  <div className="operator-focus-main">

    <div className="operator-focus-icon">
      →
    </div>

    <div>
      <span className="operator-eyebrow">
        OPERATOR FOCUS
      </span>

      <h3>
        {failureIntel?.top_opportunity
          ? `Prioritize ${failureIntel.top_opportunity.failure_reason
              .replaceAll("_", " ")
              .toLowerCase()} recovery`
          : "Prioritize the highest-value recovery"}
      </h3>

      <p>
        RecoverAI identified the highest-value recovery opportunity
        from the current failed-payment population.
      </p>
    </div>

  </div>

  <div className="operator-focus-data">

    <div>
      <span>TOP FAILURE</span>
      <strong>
        {failureIntel?.top_opportunity
          ? failureIntel.top_opportunity.failure_reason
              .replaceAll("_", " ")
              .toUpperCase()
          : "—"}
      </strong>
    </div>

    <div>
      <span>PAYMENTS</span>
      <strong>
        {failureIntel?.top_opportunity?.count ?? "—"}
      </strong>
    </div>

    <div>
      <span>RECOVERABLE</span>
      <strong>
        {formatCurrency(
          failureIntel?.top_opportunity?.estimated_recoverable ?? 0
        )}
      </strong>
    </div>

    <div>
      <span>PRIORITY</span>
      <strong className="operator-priority">
        HIGH
      </strong>
    </div>

  </div>

</div>
      <main className="container">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="hero" id="overview">
          <div className="hero-copy">
            <p className="eyebrow">
              REVENUE RECOVERY
            </p>

            <h1>
              Turn failed payments
              <br />
              into recovered revenue.
            </h1>

            <p className="hero-description">
              RecoverAI analyzes failed transactions,
              recommends recovery actions, applies
              safety guardrails, and measures simulated
              recovery outcomes.
            </p>

            <div className="incident-mode-control">
  <button
    className={`incident-button ${
      incidentMode ? "active" : ""
    }`}
    onClick={() =>
      setIncidentMode(!incidentMode)
    }
  >
    <span className="incident-button-dot" />

    {incidentMode
      ? "EXIT INCIDENT MODE"
      : "ENTER INCIDENT MODE"}
  </button>

  <span className="incident-mode-hint">
    {incidentMode
      ? "Incident response view active"
      : "Switch to operational response view"}
  </span>
</div>

            <div className="hero-actions">
              <button
                className="run-button"
                onClick={runRecovery}
                disabled={isRunning}
              >
                {isRunning
                  ? "RUNNING..."
                  : "RUN RECOVERY"}
              </button>

              {runMessage && (
                <span className="run-status">
                  {runMessage}
                </span>
              )}

              {error && metrics && (
                <span className="run-status error-text">
                  {error}
                </span>
              )}
            </div>
          </div>

          <div className="hero-rate">
            <strong>
              {recoveryRate.toFixed(2)}%
            </strong>

            <span>RECOVERY RATE</span>
          </div>
        </section>

        {incidentMode && failureIntel && (
  <section className="incident-panel" id="incident">

    <div className="incident-header">
      <div>
        <p className="eyebrow">LIVE INCIDENT MODE</p>

        <h2>Payment recovery incident</h2>

        <p className="incident-subtitle">
          RecoverAI has identified the highest-value recovery
          opportunity in the current failed-payment population.
        </p>
      </div>

      <div className="incident-status">
        <span className="incident-live-dot" />
        INCIDENT ACTIVE
      </div>
    </div>

    <div className="incident-summary">

      <div className="incident-metric">
        <span>FAILED PAYMENTS</span>
        <strong>{failureIntel.total_failed}</strong>
        <small>transactions requiring intervention</small>
      </div>

      <div className="incident-metric">
        <span>REVENUE AT RISK</span>
        <strong>
          {formatCurrency(failureIntel.total_revenue_at_risk)}
        </strong>
        <small>exposed revenue</small>
      </div>

      <div className="incident-metric">
        <span>EST. RECOVERABLE</span>
        <strong>
          {formatCurrency(
            failureIntel.total_estimated_recoverable
          )}
        </strong>
        <small>modeled opportunity</small>
      </div>

      <div className="incident-metric">
        <span>GUARDRAILS</span>
        <strong>{metrics?.guardrail_overrides ?? 0}</strong>
        <small>unsafe actions prevented</small>
      </div>

    </div>

    {failureIntel.top_opportunity && (
      <div className="incident-opportunity">

        <div>
          <p className="incident-label">
            TOP RECOVERY OPPORTUNITY
          </p>

          <h3>
            {failureIntel.top_opportunity.failure_reason
              .replaceAll("_", " ")
              .toUpperCase()}
          </h3>

          <p>
            {failureIntel.top_opportunity.count} payments
            represent the highest-priority recovery opportunity.
          </p>
        </div>

        <div className="incident-opportunity-value">

          <span>REVENUE AT RISK</span>

          <strong>
            {formatCurrency(
              failureIntel.top_opportunity.revenue_at_risk
            )}
          </strong>

          <small>
            {formatCurrency(
              failureIntel.top_opportunity.estimated_recoverable
            )} estimated recoverable
          </small>

        </div>

      </div>
    )}

    <div className="incident-recommendation">

      <div className="recommendation-icon">!</div>

      <div>
        <span>RECOMMENDED RESPONSE</span>

        <strong>
          Prioritize{" "}
          {failureIntel.top_opportunity
            ? failureIntel.top_opportunity.failure_reason
                .replaceAll("_", " ")
            : "high-value recovery"}{" "}
          recovery
        </strong>

        <p>
          Focus recovery capacity on the failure class with
          the largest revenue exposure and recovery potential.
        </p>
        <button
          className="simulate-playbook-button"
          onClick={simulatePlaybook}
          disabled={isSimulatingPlaybook}
        >
          {isSimulatingPlaybook
            ? "SIMULATING..."
            : "SIMULATE RECOVERY PLAYBOOK"}
        </button>
      </div>
      {playbookResult && (
  <div className="simulation-result">

    <div className="simulation-result-header">
      <div>
        <span>PLAYBOOK SIMULATION</span>
        <h4>Balanced recovery strategy</h4>
      </div>

      <div className="simulation-badge">
        SIMULATED
      </div>
    </div>

    <div className="simulation-metrics">

      <div>
        <span>CURRENT RECOVERY</span>
        <strong>
          {playbookResult.current?.recovery_rate ?? 0}%
        </strong>
      </div>

      <div>
        <span>PROJECTED RECOVERY</span>
        <strong>
          {playbookResult.projected?.recovery_rate ?? 0}%
        </strong>
      </div>

      <div>
        <span>RECOVERY LIFT</span>
        <strong>
          {(playbookResult.delta?.recovery_rate ?? 0) > 0
            ? "+"
            : ""}
          {playbookResult.delta?.recovery_rate ?? 0}%
        </strong>
      </div>

      <div>
        <span>ADDITIONAL REVENUE</span>
        <strong>
          {formatCurrency(
            playbookResult.delta?.recovered_revenue ?? 0
          )}
        </strong>
      </div>

    </div>

  </div>
)}

    </div>

  </section>
)}

        {/* =================================================
            KPI GRID
        ================================================= */}

        <section className="stats-grid">

          <div className="stat-card">
            <span>Revenue at risk</span>

            <strong>
              {formatCurrency(revenueAtRisk)}
            </strong>

            <small>
              {failedTransactions} failed transactions
            </small>
          </div>

          <div className="stat-card">
            <span>Estimated recoverable</span>

            <strong>
              {formatCurrency(recoverableRevenue)}
            </strong>

            <small>
              Synthetic benchmark
            </small>
          </div>

          <div className="stat-card accent-card">
            <span>Recovered revenue</span>

            <strong>
              {formatCurrency(recoveredRevenue)}
            </strong>

            <small>
              Simulated outcomes
            </small>
          </div>

          <div className="stat-card">
            <span>Guardrail overrides</span>

            <strong>
              {guardrailOverrides}
            </strong>

            <small>
              AI decisions blocked
            </small>
          </div>
        </section>

        {/* =================================================
            FAILURE INTELLIGENCE
        ================================================= */}

        {failureIntel && (
          <section className="panel" id="intelligence">

            <div className="panel-header">
              <div>
                <p className="eyebrow">
                  FAILURE INTELLIGENCE
                </p>

                <h2>
                  Where is revenue leaking?
                </h2>
              </div>

              <span className="panel-count">
                {failureIntel.total_failed || 0}
                {" "}
                failed payments
              </span>
            </div>

            <div className="intelligence-grid">

              <div className="failure-list">

                {(failureIntel.breakdown || []).map(
                  (item) => (
                    <div
                      className="failure-item"
                      key={item.failure_reason}
                    >
                      <div className="failure-main">

                        <div>
                          <strong>
                            {formatReason(
                              item.failure_reason
                            ).toUpperCase()}
                          </strong>

                          <span>
                            {item.count} payments
                          </span>
                        </div>

                        <strong>
                          {formatCurrency(
                            item.revenue_at_risk
                          )}
                        </strong>

                      </div>

                      <div className="failure-meta">
                        <span>
                          Recoverable{" "}
                          {formatCurrency(
                            item.estimated_recoverable
                          )}
                        </span>

                        <span>
                          {Number(
                            item.benchmark_attainment_pct || 0
                          ).toFixed(1)}
                          % benchmark
                        </span>
                      </div>

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(
                              Number(
                                item.benchmark_attainment_pct || 0
                              ),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}

              </div>

              {failureIntel.top_opportunity && (
                <div className="opportunity-card">

                  <p className="eyebrow">
                    TOP RECOVERY OPPORTUNITY
                  </p>

                  <h3>
                    {formatReason(
                      failureIntel.top_opportunity
                        .failure_reason
                    ).toUpperCase()}
                  </h3>

                  <span className="opportunity-label">
                    Revenue at risk
                  </span>

                  <strong className="opportunity-value">
                    {formatCurrency(
                      failureIntel.top_opportunity
                        .revenue_at_risk
                    )}
                  </strong>

                  <span className="opportunity-label">
                    Estimated recoverable
                  </span>

                  <strong className="opportunity-value">
                    {formatCurrency(
                      failureIntel.top_opportunity
                        .estimated_recoverable
                    )}
                  </strong>

                  <div className="opportunity-divider" />

                  <span className="opportunity-label">
                    Benchmark attainment
                  </span>

                  <strong className="opportunity-rate">
                    {Number(
                      failureIntel.top_opportunity
                        .benchmark_attainment_pct || 0
                    ).toFixed(1)}
                    %
                  </strong>

                  <p className="opportunity-note">
                    Prioritize recovery actions for this
                    failure class.
                  </p>

                </div>
              )}

            </div>

            <div className="intel-summary">
              <div>
                <span>
                  Total recoverable
                </span>

                <strong>
                  {formatCurrency(
                    failureIntel.total_estimated_recoverable
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Missed opportunity
                </span>

                <strong>
                  {formatCurrency(missedOpportunity)}
                </strong>
              </div>

              <div>
                <span>
                  Recovery coverage
                </span>

                <strong>
                  {recoverableRevenue > 0
                    ? (
                        (recoveredRevenue /
                          recoverableRevenue) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  %
                </strong>
              </div>
            </div>

          </section>
        )}

        {/* =================================================
            STRATEGY LAB
        ================================================= */}

        <section className="panel strategy-panel" id="strategy">

          <div className="panel-header">
            <div>
              <p className="eyebrow">
                RECOVERY STRATEGY LAB
              </p>

              <h2>
                Test the recovery policy
              </h2>
            </div>
            <div className="policy-verdict">

  <div className="policy-verdict-copy">
    <span className="policy-label">
      POLICY VERDICT
    </span>

    <h3>
      Balanced recovery policy
    </h3>

    <p>
      Compare recovery upside and policy risk before changing
      the decision strategy.
    </p>
  </div>

  <div className="policy-verdict-stats">

    <div>
      <span>CURRENT RECOVERY</span>
      <strong>
        {Number(metrics?.recovery_rate ?? 0).toFixed(2)}%
      </strong>
    </div>

    <div>
      <span>CURRENT REVENUE</span>
      <strong>
        {formatCurrency(metrics?.recovered_revenue ?? 0)}
      </strong>
    </div>

    <div>
      <span>FAILED PAYMENTS</span>
      <strong>
        {metrics?.failed_transactions ?? 0}
      </strong>
    </div>

  </div>

</div>
            <span className="panel-count">
              Simulation only
            </span>
          </div>

          <p className="strategy-description">
            Compare recovery policies before changing
            the live decision engine.
          </p>

          <div className="strategy-options">

            {[
              "CONSERVATIVE",
              "BALANCED",
              "AGGRESSIVE",
            ].map((option) => (
              <button
                key={option}
                className={`strategy-option ${
                  strategy === option
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setStrategy(option);
                  setStrategyResult(null);
                }}
              >
                {option}
              </button>
            ))}

          </div>

          <div className="strategy-actions">

            <button
              className="run-button"
              onClick={simulateStrategy}
              disabled={strategyLoading}
            >
              {strategyLoading
                ? "SIMULATING..."
                : "SIMULATE STRATEGY"}
            </button>

            {strategyResult && (
              <span className="strategy-selected">
                {strategyResult.strategy}
                {" "}
                policy selected
              </span>
            )}

          </div>

          {strategyResult && (
            <div className="strategy-results">

              {/* CURRENT */}

              <div className="strategy-column">

                <span className="strategy-column-title">
                  CURRENT
                </span>

                <div className="strategy-metric">
                  <span>
                    Recovery rate
                  </span>

                  <strong>
                    {Number(
                      strategyResult.current
                        .recovery_rate
                    ).toFixed(2)}
                    %
                  </strong>
                </div>

                <div className="strategy-metric">
                  <span>
                    Recovered revenue
                  </span>

                  <strong>
                    {formatCurrency(
                      strategyResult.current
                        .recovered_revenue
                    )}
                  </strong>
                </div>

                <div className="strategy-metric">
                  <span>
                    Retries
                  </span>

                  <strong>
                    {strategyResult.current.retry}
                  </strong>
                </div>

                <div className="strategy-metric">
                  <span>
                    Escalations
                  </span>

                  <strong>
                    {strategyResult.current.escalate}
                  </strong>
                </div>

              </div>

              {/* ARROW */}

              <div className="strategy-arrow">
                →
              </div>

              {/* PROJECTED */}

              <div className="strategy-column projected">

                <span className="strategy-column-title">
                  SIMULATED
                </span>

                <div className="strategy-metric">
                  <span>
                    Recovery rate
                  </span>

                  <strong>
                    {Number(
                      strategyResult.projected
                        .recovery_rate
                    ).toFixed(2)}
                    %
                  </strong>
                </div>

                <div className="strategy-metric">
                  <span>
                    Recovered revenue
                  </span>

                  <strong>
                    {formatCurrency(
                      strategyResult.projected
                        .recovered_revenue
                    )}
                  </strong>
                </div>

                <div className="strategy-metric">
                  <span>
                    Retries
                  </span>

                  <strong>
                    {strategyResult.projected.retry}
                  </strong>
                </div>

                <div className="strategy-metric">
                  <span>
                    Escalations
                  </span>

                  <strong>
                    {strategyResult.projected.escalate}
                  </strong>
                </div>

              </div>

              {/* SUMMARY */}

              <div className="strategy-summary">

                <div>
                  <span>
                    Recovery uplift
                  </span>

                  <strong
                    className={
                      Number(
                        strategyResult.delta
                          .recovery_rate
                      ) >= 0
                        ? "positive"
                        : "negative"
                    }
                  >
                    {Number(
                      strategyResult.delta
                        .recovery_rate
                    ) >= 0
                      ? "+"
                      : ""}
                    {Number(
                      strategyResult.delta
                        .recovery_rate
                    ).toFixed(2)}
                    %
                  </strong>
                </div>

                <div>
                  <span>
                    Revenue difference
                  </span>

                  <strong
                    className={
                      Number(
                        strategyResult.delta
                          .recovered_revenue
                      ) >= 0
                        ? "positive"
                        : "negative"
                    }
                  >
                    {Number(
                      strategyResult.delta
                        .recovered_revenue
                    ) >= 0
                      ? "+"
                      : ""}
                    {formatCurrency(
                      strategyResult.delta
                        .recovered_revenue
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Risk score
                  </span>

                  <strong>
                    {strategyResult.projected
                      .risk_score}
                    /100
                  </strong>
                </div>

              </div>

            </div>
          )}

        </section>
        {/* =================================================
    RECOVERY IMPACT
================================================= */}

<section className="panel impact-panel">

  <div className="panel-header">
    <div>
      <p className="eyebrow">
        RECOVERY IMPACT
      </p>

      <h2>
        Where the money goes
      </h2>
    </div>

    <span className="panel-count">
      Revenue intelligence
    </span>
  </div>

  <div className="impact-grid">

    {/* RECOVERED */}

    <div className="impact-card impact-primary">

      <div className="impact-card-top">
        <span>RECOVERED</span>

        <span className="impact-dot recovered-dot" />
      </div>

      <strong>
        {formatCurrency(recoveredRevenue)}
      </strong>

      <p>
        Revenue successfully recovered by the
        simulated recovery pipeline.
      </p>

      <div className="impact-bar">
        <div
          style={{
            width: `${Math.min(
              recoveryRate,
              100
            )}%`,
          }}
        />
      </div>

      <small>
        {recoveryRate.toFixed(2)}% of recoverable revenue
      </small>

    </div>

    {/* RECOVERABLE */}

    <div className="impact-card">

      <div className="impact-card-top">
        <span>RECOVERABLE</span>

        <span className="impact-dot" />
      </div>

      <strong>
        {formatCurrency(recoverableRevenue)}
      </strong>

      <p>
        Estimated revenue that the system believes
        could potentially be recovered.
      </p>

      <small>
        Based on synthetic recovery benchmarks.
      </small>

    </div>

    {/* MISSED OPPORTUNITY */}

    <div className="impact-card impact-warning">

      <div className="impact-card-top">
        <span>MISSED OPPORTUNITY</span>

        <span className="impact-dot missed-dot" />
      </div>

      <strong>
        {formatCurrency(missedOpportunity)}
      </strong>

      <p>
        Recoverable revenue that was not captured
        in the current simulation.
      </p>

      <small>
        Primary optimization opportunity.
      </small>

    </div>

  </div>

  {/* RECOVERY FUNNEL */}

  <div className="money-flow">

    <div className="money-flow-header">

      <span>
        RECOVERY FUNNEL
      </span>

      <strong>
        {recoveryRate.toFixed(1)}% captured
      </strong>

    </div>

    <div className="money-flow-track">

      <div
        className="money-flow-recovered"
        style={{
          width: `${Math.min(
            recoveryRate,
            100
          )}%`,
        }}
      />

    </div>

    <div className="money-flow-labels">

      <span>
        Recovered{" "}
        <strong>
          {formatCurrency(recoveredRevenue)}
        </strong>
      </span>

      <span>
        Remaining{" "}
        <strong>
          {formatCurrency(
            Math.max(
              recoverableRevenue -
                recoveredRevenue,
              0
            )
          )}
        </strong>
      </span>

    </div>

  </div>

  {/* BUSINESS SIGNALS */}

  <div className="business-signals">

    <div>

      <span>
        FAILED PAYMENTS
      </span>

      <strong>
        {failedTransactions}
      </strong>

      <small>
        transactions requiring intervention
      </small>

    </div>

    <div>

      <span>
        RECOVERY OPPORTUNITY
      </span>

      <strong>
        {formatCurrency(missedOpportunity)}
      </strong>

      <small>
        revenue still available
      </small>

    </div>

    <div>

      <span>
        GUARDRAIL INTERVENTIONS
      </span>

      <strong>
        {guardrailOverrides}
      </strong>

      <small>
        unsafe actions prevented
      </small>

    </div>

    <div>

      <span>
        RECOVERY EFFICIENCY
      </span>

      <strong>
        {failedTransactions > 0
          ? (
              (recoveredRevenue /
                Math.max(
                  revenueAtRisk,
                  1
                )) *
              100
            ).toFixed(1)
          : "0.0"}
        %
      </strong>

      <small>
        recovered vs. total risk
      </small>

    </div>

  </div>

</section>
        {/* =================================================
    RECOVERY DECISION SIMULATOR
================================================= */}

<section className="panel simulator-panel" id="strategy">

  <div className="panel-header">
    <div>
      <p className="eyebrow">
        DECISION SIMULATOR
      </p>

      <h2>
        What would RecoverAI do?
      </h2>
    </div>

    <span className="panel-count">
      Policy sandbox
    </span>
  </div>

  <p className="strategy-description">
    Create a hypothetical failed payment and inspect
    the complete recovery decision before execution.
  </p>

  <div className="simulator-layout">

    {/* INPUTS */}

    <div className="simulator-inputs">

      <div className="sim-field">
        <label>
          PAYMENT AMOUNT
        </label>

        <input
          type="number"
          min="1"
          value={simAmount}
          onChange={(event) =>
            setSimAmount(event.target.value)
          }
        />
      </div>

      <div className="sim-field">
        <label>
          FAILURE REASON
        </label>

        <select
          value={simFailure}
          onChange={(event) =>
            setSimFailure(event.target.value)
          }
        >
          <option value="network_error">
            Network error
          </option>

          <option value="card_expired">
            Card expired
          </option>

          <option value="bank_timeout">
            Bank timeout
          </option>

          <option value="insufficient_funds">
            Insufficient funds
          </option>

          <option value="bank_declined">
            Bank declined
          </option>
        </select>
      </div>

      <div className="sim-field">
        <label>
          PREVIOUS ATTEMPTS
        </label>

        <select
          value={simAttempts}
          onChange={(event) =>
            setSimAttempts(event.target.value)
          }
        >
          <option value="0">0 attempts</option>
          <option value="1">1 attempt</option>
          <option value="2">2 attempts</option>
          <option value="3">3 attempts</option>
          <option value="4">4 attempts</option>
        </select>
      </div>

      <div className="sim-field">
        <label>
          CUSTOMER TYPE
        </label>

        <select
          value={simCustomer}
          onChange={(event) =>
            setSimCustomer(event.target.value)
          }
        >
          <option value="returning">
            Returning customer
          </option>

          <option value="new">
            New customer
          </option>
        </select>
      </div>

      <button
        className="run-button simulator-run"
        onClick={runDecisionSimulation}
      >
        ANALYZE DECISION
      </button>

    </div>

    {/* OUTPUT */}

    <div className="simulation-output">

      {!simulation ? (
        <div className="simulation-empty">
          <span>
            ENTER A TRANSACTION
          </span>

          <strong>
            Run a policy analysis
          </strong>

          <p>
            RecoverAI will evaluate risk,
            recommendation, guardrail status,
            and expected recovery.
          </p>
        </div>
      ) : (
        <>
          <div className="simulation-top">

            <div>
              <span>
                FINAL ACTION
              </span>

              <strong
                className={
                  simulation.finalAction === "ESCALATE"
                    ? "sim-danger"
                    : simulation.finalAction === "REMINDER"
                      ? "sim-warning"
                      : "sim-success"
                }
              >
                {simulation.finalAction}
              </strong>
            </div>

            <div>
              <span>
                RISK SCORE
              </span>

              <strong>
                {simulation.riskScore}/100
              </strong>
            </div>

          </div>

          <div className="simulation-flow">

            <div className="sim-node">
              <span>AI RECOMMENDATION</span>
              <strong>
                {simulation.recommendation}
              </strong>
            </div>

            <div className="sim-arrow">
              →
            </div>

            <div className="sim-node">
              <span>GUARDRAIL</span>
              <strong
                className={
                  simulation.guardrail === "BLOCKED"
                    ? "sim-danger"
                    : "sim-success"
                }
              >
                {simulation.guardrail}
              </strong>
            </div>

            <div className="sim-arrow">
              →
            </div>

            <div className="sim-node">
              <span>FINAL ACTION</span>
              <strong>
                {simulation.finalAction}
              </strong>
            </div>

          </div>

          <div className="simulation-metrics">

            <div>
              <span>
                Recovery probability
              </span>

              <strong>
                {(
                  simulation.recoveryProbability *
                  100
                ).toFixed(0)}
                %
              </strong>
            </div>

            <div>
              <span>
                Estimated recovery
              </span>

              <strong>
                {formatCurrency(
                  simulation.estimatedRecovery
                )}
              </strong>
            </div>

          </div>

         <div className="simulation-reason">

  <span>
    WHY THIS DECISION?
  </span>

  <p>
    {simulation.explanation}
  </p>

</div>

<div className="guardrail-checks">

  <div className="guardrail-check-header">
    <span>
      POLICY TRACE
    </span>

    <strong>
      {simulation.guardrail === "BLOCKED"
        ? "INTERVENTION REQUIRED"
        : "POLICY PASSED"}
    </strong>
  </div>

  {(simulation.guardrailChecks || []).map(
    (check, index) => (
      <div
        className="guardrail-check"
        key={`${check.rule}-${index}`}
      >

        <div className="guardrail-check-number">
          0{index + 1}
        </div>

        <div className="guardrail-check-content">

          <strong>
            {check.rule}
          </strong>

          <span>
            {check.reason}
          </span>

        </div>

        <b
          className={
            check.status === "BLOCKED"
              ? "check-blocked"
              : "check-passed"
          }
        >
          {check.status}
        </b>

      </div>
    )
  )}

</div>

        </>
      )}

    </div>

  </div>

</section>
        {/* =================================================
    GUARDRAIL OBSERVATORY
================================================= */}

<section className="panel guardrail-panel">

  <div className="panel-header">
    <div>
      <p className="eyebrow">GUARDRAIL OBSERVATORY</p>
      <h2>AI safety controls</h2>
    </div>

    <span className="panel-count">
      Live policy monitoring
    </span>
  </div>

  <div className="guardrail-overview">

    <div className="guardrail-score">
      <span>GUARDRAIL HEALTH</span>

      <strong>
        {failedTransactions > 0
          ? (
              100 -
              (guardrailOverrides /
                failedTransactions) *
                100
            ).toFixed(1)
          : "100.0"}
        %
      </strong>

      <small>
        Low intervention rate
      </small>
    </div>

    <div className="guardrail-stats">

      <div className="guardrail-stat">
        <span>POLICY INTERVENTIONS</span>

        <strong>
          {guardrailOverrides}
        </strong>

        <small>
          automated decisions stopped
        </small>
      </div>

      <div className="guardrail-stat">
        <span>FAILED PAYMENTS</span>

        <strong>
          {failedTransactions}
        </strong>

        <small>
          decisions evaluated
        </small>
      </div>

      <div className="guardrail-stat">
        <span>INTERVENTION RATE</span>

        <strong>
          {failedTransactions > 0
            ? (
                (guardrailOverrides /
                  failedTransactions) *
                100
              ).toFixed(1)
            : "0.0"}
          %
        </strong>

        <small>
          transactions requiring policy control
        </small>
      </div>

      <div className="guardrail-stat">
        <span>MODE</span>

        <strong>
          ENFORCED
        </strong>

        <small>
          safety policy active
        </small>
      </div>

    </div>
  </div>

  <div className="guardrail-divider" />

  <div className="guardrail-rules">

    <div className="guardrail-rule">
      <div className="rule-icon">01</div>

      <div>
        <strong>High-value protection</strong>

        <span>
          Sensitive payment decisions are routed
          through policy controls before execution.
        </span>
      </div>

      <b>ACTIVE</b>
    </div>

    <div className="guardrail-rule">
      <div className="rule-icon">02</div>

      <div>
        <strong>Retry protection</strong>

        <span>
          Repeated recovery attempts are prevented
          from exceeding policy limits.
        </span>
      </div>

      <b>ACTIVE</b>
    </div>

    <div className="guardrail-rule">
      <div className="rule-icon">03</div>

      <div>
        <strong>Escalation safety</strong>

        <span>
          Higher-risk transactions can be diverted
          for controlled manual handling.
        </span>
      </div>

      <b>ACTIVE</b>
    </div>

  </div>

  <div className="guardrail-footer">

    <span>
      GUARDRAIL STATUS
    </span>

    <strong>
      {guardrailOverrides > 0
        ? "INTERVENTIONS DETECTED"
        : "NO INTERVENTIONS"}
    </strong>

    <span>
      RecoverAI policy engine is operating before
      automated recovery execution.
    </span>

  </div>

</section>

        {/* =================================================
            DECISION DISTRIBUTION
        ================================================= */}

        <section className="panel">

          <div className="panel-header">

            <div>
              <p className="eyebrow">
                DECISION DISTRIBUTION
              </p>

              <h2>
                Recovery actions
              </h2>
            </div>

            <span className="panel-count">
              {failedTransactions} failed payments
            </span>

          </div>

          <div className="action-list">

            <div className="action-item">
              <div className="action-row">
                <span>Retry</span>
                <strong>{retryCount}</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(
                      (retryCount /
                        Math.max(
                          failedTransactions,
                          1
                        )) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="action-item">
              <div className="action-row">
                <span>Reminder</span>
                <strong>{reminderCount}</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(
                      (reminderCount /
                        Math.max(
                          failedTransactions,
                          1
                        )) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="action-item">
              <div className="action-row">
                <span>Escalate</span>
                <strong>{escalateCount}</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(
                      (escalateCount /
                        Math.max(
                          failedTransactions,
                          1
                        )) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

          </div>

        </section>

        {/* =================================================
            RECOVERY PERFORMANCE
        ================================================= */}

        <section className="panel">

          <div className="panel-header">
            <div>
              <p className="eyebrow">
                RECOVERY PERFORMANCE
              </p>

              <h2>
                Recovered vs. recoverable
              </h2>
            </div>
          </div>

          <div className="recovery-rate-panel">

            <strong>
              {recoveryRate.toFixed(2)}%
            </strong>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(
                    recoveryRate,
                    100
                  )}%`,
                }}
              />
            </div>

            <div className="recovery-labels">

              <div>
                <span>RECOVERED</span>

                <strong>
                  {formatCurrency(
                    recoveredRevenue
                  )}
                </strong>
              </div>

              <div>
                <span>RECOVERABLE</span>

                <strong>
                  {formatCurrency(
                    recoverableRevenue
                  )}
                </strong>
              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            RECENT DECISIONS
        ================================================= */}

        <section className="panel decisions-panel" id="audit">

          <div className="panel-header">

            <div>
              <p className="eyebrow">
                AUDIT TRAIL
              </p>

              <h2>
                Recent decisions
              </h2>
            </div>

            <span className="panel-count">
              {totalTransactions} transactions
            </span>

          </div>

          <div className="decision-controls">

            <input
              type="text"
              placeholder="Search transaction ID..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="ALL">
                All
              </option>

              <option value="RETRY">
                Retry
              </option>

              <option value="REMINDER">
                Reminder
              </option>

              <option value="ESCALATE">
                Escalate
              </option>

              <option value="RECOVERED">
                Recovered
              </option>

              <option value="NOT_RECOVERED">
                Not recovered
              </option>

              <option value="ESCALATED">
                Escalated
              </option>
            </select>

          </div>

          <div className="table">

            <div className="table-header">
              <span>Transaction</span>
              <span>Amount</span>
              <span>Action</span>
              <span>Outcome</span>
            </div>

            {filteredDecisions.map((item) => (
              <div
                className="table-row clickable-row"
                key={item.transaction_id}
                onClick={() =>
                  setSelectedDecision(item)
                }
              >
                <span className="transaction-id">
                  {item.transaction_id}
                </span>

                <span>
                  {formatCurrency(item.amount)}
                </span>

                <span>
                  <span
                    className={`badge ${String(
                      item.action || ""
                    ).toLowerCase()}`}
                  >
                    {item.action}
                  </span>
                </span>

                <span>
                  <span
                    className={`outcome ${String(
                      item.outcome || ""
                    )
                      .toLowerCase()
                      .replaceAll(" ", "-")}`}
                  >
                    {item.outcome}
                  </span>
                </span>
              </div>
            ))}

            {filteredDecisions.length === 0 && (
              <div className="empty-table">
                No transactions match the current filter.
              </div>
            )}

          </div>

        </section>

        {/* =================================================
            DECISION DETAILS
        ================================================= */}

        {selectedDecision && (
          <section className="panel detail-panel">

            <div className="panel-header">

              <div>
                <p className="eyebrow">
                  DECISION DETAILS
                </p>

                <h2>
                  {selectedDecision.transaction_id}
                </h2>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setSelectedDecision(null)
                }
              >
                Close
              </button>

            </div>

            <div className="detail-grid">

              <div className="detail-card">
                <span>Amount</span>

                <strong>
                  {formatCurrency(
                    selectedDecision.amount
                  )}
                </strong>
              </div>

              <div className="detail-card">
                <span>AI recommendation</span>

                <strong>
                  {selectedDecision.ai_recommendation ||
                    selectedDecision.action ||
                    "—"}
                </strong>
              </div>

              <div className="detail-card">
                <span>AI confidence</span>

                <strong>
                  {selectedDecision.ai_confidence != null
                    ? `${(
                        Number(
                          selectedDecision.ai_confidence
                        ) * 100
                      ).toFixed(0)}%`
                    : "—"}
                </strong>
              </div>

              <div className="detail-card">
                <span>AI source</span>

                <strong>
                  {selectedDecision.ai_source || "—"}
                </strong>
              </div>

              <div className="detail-card">
                <span>Policy action</span>

                <strong>
                  {selectedDecision.policy_action ||
                    "—"}
                </strong>
              </div>

              <div className="detail-card">
                <span>Guardrail</span>

                <strong>
                  {selectedDecision.guardrail_result ||
                    "—"}
                </strong>
              </div>

              <div className="detail-card">
                <span>Final action</span>

                <strong>
                  {selectedDecision.action || "—"}
                </strong>
              </div>

              <div className="detail-card">
                <span>Outcome</span>

                <strong>
                  {selectedDecision.outcome || "—"}
                </strong>
              </div>

            </div>
            <div className="explainability-panel">

  <div className="explainability-header">
    <div>
      <p className="eyebrow">DECISION EXPLANATION</p>
      <h3>Why RecoverAI chose this action</h3>
    </div>

    <span className="explainability-badge">
      EXPLAINABLE
    </span>
  </div>

  <div className="explainability-content">

    <div className="explainability-reason">
      <span>PRIMARY SIGNAL</span>

      <strong>
        {selectedDecision.reason || "Recovery policy evaluation"}
      </strong>

      <p>
        RecoverAI evaluated the payment failure, transaction
        context, policy constraints, confidence score, and
        guardrail result before producing the final action.
      </p>
    </div>

    <div className="explainability-factors">

      <div>
        <span>AI CONFIDENCE</span>
        <strong>
          {selectedDecision.ai_confidence != null
            ? `${(
                Number(selectedDecision.ai_confidence) * 100
              ).toFixed(0)}%`
            : "—"}
        </strong>
      </div>

      <div>
        <span>AI SOURCE</span>
        <strong>
          {selectedDecision.ai_source || "—"}
        </strong>
      </div>

      <div>
        <span>POLICY</span>
        <strong>
          {selectedDecision.policy_action || "—"}
        </strong>
      </div>

      <div>
        <span>GUARDRAIL</span>
        <strong>
          {selectedDecision.guardrail_result || "—"}
        </strong>
      </div>

    </div>

  </div>

  <div className="explainability-flow">

    <div className="flow-step">
      <span>01</span>
      <strong>Failure detected</strong>
      <small>
        Payment failure classified from transaction signals.
      </small>
    </div>

    <div className="flow-arrow">→</div>

    <div className="flow-step">
      <span>02</span>
      <strong>AI recommendation</strong>
      <small>
        Recovery action selected using the decision engine.
      </small>
    </div>

    <div className="flow-arrow">→</div>

    <div className="flow-step">
      <span>03</span>
      <strong>Guardrail check</strong>
      <small>
        Policy constraints validate or block the action.
      </small>
    </div>

    <div className="flow-arrow">→</div>

    <div className="flow-step">
      <span>04</span>
      <strong>Final outcome</strong>
      <small>
        Final action is recorded in the audit trail.
      </small>
    </div>

  </div>

</div>

            <div className="detail-reason">

              <span>DECISION REASON</span>

              <p>
                {selectedDecision.reason ||
                  selectedDecision.policy_reason ||
                  "No reason recorded."}
              </p>

            </div>

            <div className="detail-recovered">

              <span>
                AMOUNT RECOVERED
              </span>

              <strong>
                {formatCurrency(
                  selectedDecision.amount_recovered
                )}
              </strong>

            </div>

          </section>
        )}

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer>
          <span>
            RECOVERAI · SYNTHETIC EVALUATION ENVIRONMENT
          </span>

          <span>
            {totalTransactions} TRANSACTIONS ANALYZED
          </span>
        </footer>

      </main>
    </div>
  );
}

export default App;