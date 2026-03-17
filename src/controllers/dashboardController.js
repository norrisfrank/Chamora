const db = require('../config/db');

const buildFinancialReport = async (query) => {
    const { startDate, endDate, groupId } = query;
    const params = [];
    let contribWhere = '1=1';
    let loanWhere = '1=1';

    if (startDate) {
        params.push(startDate);
        contribWhere += ` AND c.date >= $${params.length}`;
        loanWhere += ` AND l.created_at >= $${params.length}`;
    }
    if (endDate) {
        params.push(endDate);
        contribWhere += ` AND c.date <= $${params.length}`;
        loanWhere += ` AND l.created_at <= $${params.length}`;
    }
    if (groupId) {
        params.push(groupId);
        contribWhere += ` AND c.group_id = $${params.length}`;
        loanWhere += ` AND l.group_id = $${params.length}`;
    }

    const contributionsSummaryRes = await db.query(
        `SELECT
            COUNT(*)::int as count,
            COALESCE(SUM(c.amount), 0) as total_amount,
            COALESCE(SUM(CASE WHEN c.status = 'completed' THEN c.amount ELSE 0 END), 0) as total_completed,
            COALESCE(SUM(CASE WHEN c.status = 'pending' THEN c.amount ELSE 0 END), 0) as total_pending,
            COALESCE(SUM(CASE WHEN c.status = 'failed' THEN c.amount ELSE 0 END), 0) as total_failed
         FROM contributions c
         WHERE ${contribWhere}`,
        params
    );

    const contributionsRes = await db.query(
        `SELECT c.id, c.amount, c.status, c.date, c.payment_method, c.mpesa_receipt_number,
                g.name as group_name, u.first_name, u.last_name
         FROM contributions c
         JOIN users u ON c.user_id = u.id
         JOIN groups g ON c.group_id = g.id
         WHERE ${contribWhere}
         ORDER BY c.date DESC`,
        params
    );

    const loansSummaryRes = await db.query(
        `SELECT
            COUNT(*)::int as count,
            COALESCE(SUM(l.amount), 0) as total_principal,
            COALESCE(SUM(CASE WHEN l.status IN ('active', 'approved', 'pending') THEN l.amount ELSE 0 END), 0) as outstanding_principal
         FROM loans l
         WHERE ${loanWhere}`,
        params
    );

    const loansRes = await db.query(
        `SELECT l.id, l.amount, l.interest, l.status, l.due_date, l.created_at,
                u.first_name, u.last_name
         FROM loans l
         JOIN users u ON l.user_id = u.id
         WHERE ${loanWhere}
         ORDER BY l.created_at DESC`,
        params
    );

    const interestRes = await db.query(
        `SELECT
            COALESCE(SUM(l.amount * (l.interest / 100)), 0) as interest_earned
         FROM loans l
         WHERE ${loanWhere} AND l.status IN ('active', 'approved', 'paid')`,
        params
    );

    return {
        contributions: {
            summary: contributionsSummaryRes.rows[0],
            items: contributionsRes.rows
        },
        loans: {
            summary: loansSummaryRes.rows[0],
            items: loansRes.rows
        },
        interestEarned: parseFloat(interestRes.rows[0]?.interest_earned || 0)
    };
};

const dashboardController = {
    getStats: async (req, res) => {
        try {
            const memberCountRes = await db.query('SELECT COUNT(*) FROM group_members WHERE group_id = $1', [req.groupId]);
            const totalMembers = parseInt(memberCountRes.rows[0].count);

            const totalSavingsRes = await db.query('SELECT SUM(amount) FROM contributions WHERE status = \'completed\' AND group_id = $1', [req.groupId]);
            const totalSavings = parseFloat(totalSavingsRes.rows[0].sum || 0);

            const activeLoansRes = await db.query('SELECT SUM(amount) FROM loans WHERE (status = \'active\' OR status = \'pending\') AND group_id = $1', [req.groupId]);
            const activeLoansAmount = parseFloat(activeLoansRes.rows[0].sum || 0);

            const monthlySavingsRes = await db.query('SELECT SUM(amount) FROM contributions WHERE status = \'completed\' AND date >= date_trunc(\'month\', CURRENT_DATE) AND group_id = $1', [req.groupId]);
            const monthlySavings = parseFloat(monthlySavingsRes.rows[0].sum || 0);

            res.json({
                totalMembers,
                totalSavings,
                activeLoansAmount,
                monthlySavings,
                lastUpdated: new Date()
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    getFinancialReports: async (req, res) => {
        try {
            const data = await buildFinancialReport({ ...req.query, groupId: req.groupId });
            res.json(data);
        } catch (error) {
            console.error('Error generating financial reports:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    exportFinancialReports: async (req, res) => {
        try {
            const format = String(req.query.format || 'csv').toLowerCase();
            const data = await buildFinancialReport({ ...req.query, groupId: req.groupId });

                return res.status(400).json({ message: 'Unsupported format. Use format=csv' });
            }

            const lines = [];
            lines.push('Contributions Report');
            lines.push('id,member,group,amount,status,date,payment_method,mpesa_receipt');
            data.contributions.items.forEach(item => {
                const member = `${item.first_name || ''} ${item.last_name || ''}`.trim();
                lines.push([
                    item.id,
                    `"${member}"`,
                    `"${item.group_name}"`,
                    item.amount,
                    item.status,
                    item.date,
                    item.payment_method || '',
                    item.mpesa_receipt_number || ''
                ].join(','));
            });
            lines.push('');
            lines.push('Loans Report');
            lines.push('id,member,amount,interest,status,due_date,created_at');
            data.loans.items.forEach(item => {
                const member = `${item.first_name || ''} ${item.last_name || ''}`.trim();
                lines.push([
                    item.id,
                    `"${member}"`,
                    item.amount,
                    item.interest,
                    item.status,
                    item.due_date,
                    item.created_at
                ].join(','));
            });
            lines.push('');
            lines.push(`Interest Earned,${data.interestEarned}`);

            const csv = lines.join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="financial-report.csv"');
            res.send(csv);
        } catch (error) {
            console.error('Error exporting financial reports:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    getAuditLogs: async (req, res) => {
        try {
            const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
            const offset = parseInt(req.query.offset || '0', 10);
            const action = req.query.action;
            const params = [];
            let where = '1=1';

            if (action) {
                params.push(action);
                where += ` AND a.action = $${params.length}`;
            }

            params.push(limit, offset);

            const logsRes = await db.query(
                `SELECT a.*, u.first_name, u.last_name
                 FROM audit_logs a
                 LEFT JOIN users u ON a.actor_id = u.id
                 WHERE ${where}
                 ORDER BY a.created_at DESC
                 LIMIT $${params.length - 1} OFFSET $${params.length}`,
                params
            );
            res.json(logsRes.rows);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
};

module.exports = dashboardController;
