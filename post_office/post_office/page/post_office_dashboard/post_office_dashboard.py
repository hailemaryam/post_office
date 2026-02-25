import frappe


@frappe.whitelist()
def get_dashboard_data():
	bag_type_distribution = frappe.db.sql(
		"""
		SELECT bag_type AS label, COUNT(*) AS value
		FROM `tabBag Dispatched Detail`
		WHERE IFNULL(bag_type, '') != ''
		GROUP BY bag_type
		ORDER BY value DESC
		""",
		as_dict=True,
	)

	weight_by_origin = frappe.db.sql(
		"""
		SELECT origin_office AS label, ROUND(SUM(weight), 2) AS value
		FROM `tabBag Dispatched Detail`
		WHERE IFNULL(origin_office, '') != ''
		GROUP BY origin_office
		ORDER BY value DESC
		LIMIT 10
		""",
		as_dict=True,
	)

	items_by_carrier = frappe.db.sql(
		"""
		SELECT carrier AS label, SUM(number_of_ordinary_items) AS value
		FROM `tabBag Dispatched Detail`
		WHERE IFNULL(carrier, '') != ''
		GROUP BY carrier
		ORDER BY value DESC
		LIMIT 10
		""",
		as_dict=True,
	)

	weight_distribution = frappe.db.sql(
		"""
		SELECT
			CASE
				WHEN weight <= 5 THEN '0-5 kg'
				WHEN weight <= 10 THEN '5-10 kg'
				WHEN weight <= 20 THEN '10-20 kg'
				WHEN weight <= 50 THEN '20-50 kg'
				ELSE '50+ kg'
			END AS label,
			COUNT(*) AS value
		FROM `tabBag Dispatched Detail`
		GROUP BY label
		ORDER BY MIN(weight)
		""",
		as_dict=True,
	)

	top_offices = frappe.db.sql(
		"""
		SELECT origin_office AS office, ROUND(SUM(weight), 2) AS total_weight, ROUND(COALESCE(SUM(revenue), 0), 2) AS total_revenue
		FROM `tabBag Dispatched Detail`
		WHERE IFNULL(origin_office, '') != ''
		GROUP BY origin_office
		ORDER BY total_weight DESC
		LIMIT 5
		""",
		as_dict=True,
	)

	totals = frappe.db.sql(
		"""
		SELECT
			ROUND(COALESCE(SUM(weight), 0), 2) AS total_weight,
			COUNT(*) AS total_bags,
			COALESCE(SUM(number_of_ordinary_items), 0) AS total_ordinary_items,
			ROUND(COALESCE(AVG(weight), 0), 2) AS avg_weight_per_bag
		FROM `tabBag Dispatched Detail`
		""",
		as_dict=True,
	)[0]

	return {
		"bag_type_distribution": bag_type_distribution,
		"weight_by_origin": weight_by_origin,
		"items_by_carrier": items_by_carrier,
		"weight_distribution": weight_distribution,
		"top_offices": top_offices,
		"totals": totals,
	}
