frappe.pages["post-office-dashboard"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: "Post Office Dashboard",
		single_column: true,
	});

	page.set_secondary_action("Refresh", () => wrapper.dashboard.fetch_data(), "refresh");
	wrapper.dashboard = new PostOfficeDashboard(page);
};

class PostOfficeDashboard {
	constructor(page) {
		this.page = page;
		this.container = $(this.page.body);
		this.charts = {};
		this.render_skeleton();
		this.fetch_data();
	}

	render_skeleton() {
		this.container.html(`
			<div class="po-dashboard">
				<div class="po-stats-row">
					<div class="po-stat-card" id="stat-total-weight">
						<div class="po-stat-icon">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
								stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
								<line x1="7" y1="7" x2="7.01" y2="7"/>
							</svg>
						</div>
						<div class="po-stat-content">
							<div class="po-stat-value">--</div>
							<div class="po-stat-label">Total Weight (kg)</div>
						</div>
					</div>
					<div class="po-stat-card" id="stat-total-bags">
						<div class="po-stat-icon">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
								stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
								<line x1="3" y1="6" x2="21" y2="6"/>
								<path d="M16 10a4 4 0 01-8 0"/>
							</svg>
						</div>
						<div class="po-stat-content">
							<div class="po-stat-value">--</div>
							<div class="po-stat-label">Total Bags</div>
						</div>
					</div>
					<div class="po-stat-card" id="stat-total-items">
						<div class="po-stat-icon">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
								stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
								<rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
							</svg>
						</div>
						<div class="po-stat-content">
							<div class="po-stat-value">--</div>
							<div class="po-stat-label">Total Ordinary Items</div>
						</div>
					</div>
					<div class="po-stat-card" id="stat-avg-weight">
						<div class="po-stat-icon">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
								stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<line x1="12" y1="20" x2="12" y2="10"/>
								<line x1="18" y1="20" x2="18" y2="4"/>
								<line x1="6" y1="20" x2="6" y2="16"/>
							</svg>
						</div>
						<div class="po-stat-content">
							<div class="po-stat-value">--</div>
							<div class="po-stat-label">Avg Weight per Bag</div>
						</div>
					</div>
				</div>

				<div class="po-table-section">
					<div class="po-chart-card">
						<div class="po-chart-header">
							<div class="po-chart-title">Top 5 Offices by Weight</div>
						</div>
						<div class="po-chart-body" id="top-offices-table"></div>
					</div>
				</div>

				<div class="po-charts-row">
					<div class="po-chart-card">
						<div class="po-chart-header">
							<div class="po-chart-title">Bag Type Distribution</div>
						</div>
						<div class="po-chart-body" id="chart-bag-type"></div>
					</div>
					<div class="po-chart-card">
						<div class="po-chart-header">
							<div class="po-chart-title">Total Weight by Origin</div>
						</div>
						<div class="po-chart-body" id="chart-weight-origin"></div>
					</div>
				</div>

				<div class="po-charts-row">
					<div class="po-chart-card">
						<div class="po-chart-header">
							<div class="po-chart-title">Ordinary Items by Carrier</div>
						</div>
						<div class="po-chart-body" id="chart-items-carrier"></div>
					</div>
					<div class="po-chart-card">
						<div class="po-chart-header">
							<div class="po-chart-title">Bag Weight Distribution</div>
						</div>
						<div class="po-chart-body" id="chart-weight-dist"></div>
					</div>
				</div>
			</div>
		`);
	}

	fetch_data() {
		this.container.find(".po-stat-value").text("--");
		frappe.call({
			method: "post_office.post_office.page.post_office_dashboard.post_office_dashboard.get_dashboard_data",
			callback: (r) => {
				if (r.message) {
					this.data = r.message;
					this.render_dashboard();
				}
			},
		});
	}

	render_dashboard() {
		this.render_stat_cards();
		this.render_bag_type_chart();
		this.render_weight_origin_chart();
		this.render_items_carrier_chart();
		this.render_weight_dist_chart();
		this.render_top_offices();
	}

	render_stat_cards() {
		const t = this.data.totals;
		this.animate_counter("#stat-total-weight .po-stat-value", t.total_weight);
		this.animate_counter("#stat-total-bags .po-stat-value", t.total_bags);
		this.animate_counter("#stat-total-items .po-stat-value", t.total_ordinary_items);
		this.animate_counter("#stat-avg-weight .po-stat-value", t.avg_weight_per_bag);
	}

	animate_counter(selector, target) {
		const el = this.container.find(selector);
		const duration = 600;
		const start = 0;
		const startTime = performance.now();

		const step = (currentTime) => {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			const current = start + (target - start) * eased;
			el.text(Number.isInteger(target) ? Math.round(current) : current.toFixed(2));
			if (progress < 1) requestAnimationFrame(step);
		};
		requestAnimationFrame(step);
	}

	render_bag_type_chart() {
		const data = this.data.bag_type_distribution;
		const el = this.container.find("#chart-bag-type");
		el.empty();
		if (!data.length) {
			el.html(this.no_data_html());
			return;
		}
		this.charts.bag_type = new frappe.Chart(el[0], {
			data: {
				labels: data.map((d) => d.label),
				datasets: [{ values: data.map((d) => d.value) }],
			},
			type: "pie",
			height: 280,
			colors: ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F", "#EDC948", "#B07AA1", "#FF9DA7"],
		});
	}

	render_weight_origin_chart() {
		const data = this.data.weight_by_origin;
		const el = this.container.find("#chart-weight-origin");
		el.empty();
		if (!data.length) {
			el.html(this.no_data_html());
			return;
		}
		this.charts.weight_origin = new frappe.Chart(el[0], {
			data: {
				labels: data.map((d) => d.label),
				datasets: [{ name: "Weight (kg)", values: data.map((d) => d.value) }],
			},
			type: "bar",
			height: 280,
			colors: ["#4E79A7"],
			barOptions: { spaceRatio: 0.4 },
			tooltipOptions: { formatTooltipY: (d) => d + " kg" },
		});
	}

	render_items_carrier_chart() {
		const data = this.data.items_by_carrier;
		const el = this.container.find("#chart-items-carrier");
		el.empty();
		if (!data.length) {
			el.html(this.no_data_html());
			return;
		}
		this.charts.items_carrier = new frappe.Chart(el[0], {
			data: {
				labels: data.map((d) => d.label),
				datasets: [{ name: "Items", values: data.map((d) => d.value) }],
			},
			type: "bar",
			height: 280,
			colors: ["#59A14F"],
			barOptions: { spaceRatio: 0.4 },
		});
	}

	render_weight_dist_chart() {
		const data = this.data.weight_distribution;
		const el = this.container.find("#chart-weight-dist");
		el.empty();
		if (!data.length) {
			el.html(this.no_data_html());
			return;
		}
		this.charts.weight_dist = new frappe.Chart(el[0], {
			data: {
				labels: data.map((d) => d.label),
				datasets: [{ name: "Bag Count", values: data.map((d) => d.value) }],
			},
			type: "bar",
			height: 280,
			colors: ["#E15759"],
			barOptions: { spaceRatio: 0.4 },
		});
	}

	render_top_offices() {
		const data = this.data.top_offices;
		const el = this.container.find("#top-offices-table");
		el.empty();
		if (!data.length) {
			el.html(this.no_data_html());
			return;
		}

		const max_weight = Math.max(...data.map((d) => d.total_weight));
		let rows = data
			.map(
				(d, i) => `
			<tr>
				<td class="po-rank">${i + 1}</td>
				<td class="po-office-name">${frappe.utils.escape_html(d.office)}</td>
				<td class="po-weight-cell">
					<div class="po-weight-bar-wrapper">
						<div class="po-weight-bar" style="width: ${(d.total_weight / max_weight) * 100}%"></div>
						<span class="po-weight-value">${d.total_weight} kg</span>
					</div>
				</td>
				<td class="po-revenue-cell">${frappe.format(d.total_revenue, { fieldtype: "Currency" })}</td>
			</tr>`
			)
			.join("");

		el.html(`
			<table class="po-table">
				<thead>
					<tr>
						<th style="width:50px">#</th>
						<th>Office</th>
						<th>Total Weight</th>
						<th>Revenue</th>
					</tr>
				</thead>
				<tbody>${rows}</tbody>
			</table>
		`);
	}

	no_data_html() {
		return `<div class="po-no-data">
			<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)"
				stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="10"/>
				<line x1="12" y1="8" x2="12" y2="12"/>
				<line x1="12" y1="16" x2="12.01" y2="16"/>
			</svg>
			<div style="margin-top:8px">No data available</div>
		</div>`;
	}
}
