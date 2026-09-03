import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { adminApi, userApi } from '../api';

/**
 * Admin Executive Analytics Dashboard Charts
 * 100% Database-Driven: Aggregates user accounts, activity logs, and sectors from PostgreSQL.
 * Strict fixed container dimensions: Guarantees ZERO resizing or layout jumping when switching views.
 */
export default function AdminAnalyticsCharts({ stats = { total: 0, pending: 0, approved: 0, rejected: 0 }, token }) {
  const [altChartType, setAltChartType] = useState('monthly'); // 'monthly', 'categoryShare', 'categoryRanking'
  const [dbLogs, setDbLogs] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);

  // Robust date parser supporting YYYY-MM-DD, DD-MM-YYYY, and ISO formats
  const getMonthIndex = (dateStr) => {
    if (!dateStr) return -1;
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return parseInt(parts[1], 10) - 1;
      } else if (parts[2] && parts[2].length >= 4) {
        // DD-MM-YYYY
        return parseInt(parts[1], 10) - 1;
      }
    }
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) ? d.getMonth() : -1;
  };

  // Fetch real database records for Admin Charts
  useEffect(() => {
    if (!token) return;

    // Fetch system activity logs (all users)
    adminApi
      .getActivityLogs(token, { page: 0, size: 1000 })
      .then((res) => {
        const logs = res?.content || (Array.isArray(res) ? res : []);
        setDbLogs(logs);
      })
      .catch((err) => console.error('Admin charts log fetch error:', err));

    // Fetch activity categories
    adminApi
      .getCategories(token, { page: 0, size: 100 })
      .then((res) => {
        const cats = res?.content || (Array.isArray(res) ? res : []);
        if (cats.length > 0) {
          setDbCategories(cats);
        } else {
          userApi.getCategories(token).then((userRes) => {
            const userCats = userRes?.content || (Array.isArray(userRes) ? userRes : []);
            setDbCategories(userCats);
          });
        }
      })
      .catch(() => {
        userApi.getCategories(token).then((userRes) => {
          const userCats = userRes?.content || (Array.isArray(userRes) ? userRes : []);
          setDbCategories(userCats);
        });
      });
  }, [token]);

  // 1. Donut Chart Option: User Status Distribution (100% Live DB Counts)
  const donutOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0F172A',
        borderColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: '#F8FAFC', fontSize: 12 },
        formatter: '{a}<br/><strong>{b}</strong>: {c} Accounts ({d}%)',
      },
      legend: {
        bottom: '2%',
        left: 'center',
        textStyle: { color: '#CBD5E1', fontSize: 12, fontWeight: '600' },
        formatter: (name) => {
          const counts = {
            Approved: Number(stats.approved || 0),
            'Pending Review': Number(stats.pending || 0),
            Rejected: Number(stats.rejected || 0),
          };
          return `${name} (${counts[name] ?? 0})`;
        },
      },
      series: [
        {
          name: 'Account Status',
          type: 'pie',
          radius: ['45%', '68%'],
          center: ['50%', '44%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#1E293B',
            borderWidth: 2,
          },
          label: { show: false },
          data: [
            { value: Number(stats.approved || 0), name: 'Approved', itemStyle: { color: '#10B981' } },
            { value: Number(stats.pending || 0), name: 'Pending Review', itemStyle: { color: '#F59E0B' } },
            { value: Number(stats.rejected || 0), name: 'Rejected', itemStyle: { color: '#EF4444' } },
          ],
        },
      ],
    };
  }, [stats]);

  // 2. Aggregate monthly system emission volume strictly from DB logs
  const monthlyAggregated = useMemo(() => {
    const sums = new Array(12).fill(0);
    if (Array.isArray(dbLogs)) {
      dbLogs.forEach((log) => {
        const dateStr = log.activityDateIso || log.activityDate || log.logDate;
        const mIdx = getMonthIndex(dateStr);
        if (mIdx >= 0 && mIdx < 12) {
          sums[mIdx] += Number(log.totalEmission || log.kgCo2e || 0);
        }
      });
    }
    return sums.map((v) => Math.round(v * 10) / 10);
  }, [dbLogs]);

  // Calibrated max value with clean 25 kg intervals
  const maxMonthlyVal = useMemo(() => {
    const maxVal = Math.max(...monthlyAggregated, 10);
    return Math.ceil((maxVal * 1.2) / 25) * 25;
  }, [monthlyAggregated]);

  const monthlyTrendOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0F172A',
        borderColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: '#F8FAFC', fontSize: 12 },
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          if (!params || !params.length) return '';
          const p = params[0];
          return `<div style="font-weight:700;margin-bottom:4px;color:#F8FAFC;">${p.axisValueLabel} Emissions</div>
            <span style="color:#94A3B8;">${p.seriesName}:</span> <strong style="color:#10B981;">${p.value} kg CO₂e</strong>`;
        },
      },
      grid: {
        top: 25,
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          axisLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '500' },
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
          axisTick: { show: false },
        },
      ],
      yAxis: [
        {
          type: 'value',
          min: 0,
          max: maxMonthlyVal,
          minInterval: 25,
          axisLabel: { color: '#94A3B8', fontSize: 11, formatter: '{value} kg' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
        },
      ],
      series: [
        {
          name: 'Total Emissions',
          type: 'bar',
          barMaxWidth: 28,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#34D399' },
                { offset: 1, color: '#059669' },
              ],
            },
            borderRadius: [6, 6, 0, 0],
          },
          label: {
            show: true,
            position: 'top',
            color: '#CBD5E1',
            fontSize: 11,
            fontWeight: 700,
            formatter: (params) => (params.value > 0 ? `${params.value} kg` : ''),
          },
          data: monthlyAggregated,
        },
      ],
    };
  }, [monthlyAggregated, maxMonthlyVal]);

  // 3. Category Data dynamically computed strictly from DB categories and logs
  const categoryData = useMemo(() => {
    const categoriesToMap = dbCategories.length > 0
      ? dbCategories
      : [
          { id: 1, name: 'Transportation' },
          { id: 2, name: 'Home Energy' },
          { id: 3, name: 'Food & Diet' },
          { id: 4, name: 'Shopping' },
          { id: 5, name: 'Waste & Recycling' },
        ];

    return categoriesToMap.map((cat) => {
      const catLogs = dbLogs.filter((l) => {
        if (l.categoryId && String(l.categoryId) === String(cat.id)) return true;
        if (l.category && l.category.id && String(l.category.id) === String(cat.id)) return true;
        if (l.categoryName && cat.name && l.categoryName.trim().toLowerCase().includes(cat.name.trim().toLowerCase())) return true;
        if (l.categoryCode && cat.categoryCode && l.categoryCode === cat.categoryCode) return true;
        return false;
      });

      const totalKg = catLogs.reduce((acc, curr) => acc + Number(curr.totalEmission || curr.kgCo2e || 0), 0);
      return {
        name: cat.name,
        count: catLogs.length,
        totalKg: Math.round(totalKg * 10) / 10,
      };
    });
  }, [dbCategories, dbLogs]);

  // Category Share Donut (%) strictly from DB
  const categoryShareOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0F172A',
        borderColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: '#F8FAFC', fontSize: 12 },
        formatter: '{a}<br/><strong>{b}</strong>: {c} Logs ({d}%)',
      },
      legend: {
        bottom: '2%',
        left: 'center',
        textStyle: { color: '#CBD5E1', fontSize: 11, fontWeight: '500' },
        formatter: (name) => {
          const item = categoryData.find((c) => c.name === name);
          return item ? `${name} (${item.count})` : name;
        },
      },
      series: [
        {
          name: 'Activity Sector',
          type: 'pie',
          radius: ['45%', '68%'],
          center: ['50%', '44%'],
          itemStyle: { borderRadius: 8, borderColor: '#1E293B', borderWidth: 2 },
          label: { show: false },
          data: categoryData.map((c, i) => {
            const colors = ['#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#10B981', '#06B6D4'];
            return { value: c.count, name: c.name, itemStyle: { color: colors[i % colors.length] } };
          }),
        },
      ],
    };
  }, [categoryData]);

  // 4. Category Emission Ranking Bar Chart strictly from DB
  const maxCategoryKg = useMemo(() => {
    const maxVal = Math.max(...categoryData.map((c) => c.totalKg), 10);
    return Math.ceil((maxVal * 1.2) / 25) * 25;
  }, [categoryData]);

  const categoryRankingOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0F172A',
        borderColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: '#F8FAFC', fontSize: 12 },
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          if (!params || !params.length) return '';
          const p = params[0];
          return `<div style="font-weight:700;margin-bottom:4px;color:#F8FAFC;">${p.name}</div>
            <span style="color:#94A3B8;">Total Emissions:</span> <strong style="color:#3B82F6;">${p.value} kg CO₂e</strong>`;
        },
      },
      grid: {
        top: 15,
        left: '4%',
        right: '15%',
        bottom: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        min: 0,
        max: maxCategoryKg,
        minInterval: 25,
        axisLabel: { color: '#94A3B8', fontSize: 11, formatter: '{value} kg' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      },
      yAxis: {
        type: 'category',
        data: categoryData.map((c) => c.name),
        axisLabel: { color: '#CBD5E1', fontSize: 11, fontWeight: '600' },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisTick: { show: false },
      },
      series: [
        {
          name: 'Sector Emissions',
          type: 'bar',
          barMaxWidth: 20,
          data: categoryData.map((c, i) => {
            const colors = ['#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#10B981', '#06B6D4'];
            return {
              value: c.totalKg,
              itemStyle: { color: colors[i % colors.length], borderRadius: [0, 6, 6, 0] },
            };
          }),
          label: {
            show: true,
            position: 'right',
            color: '#FFF',
            fontWeight: 700,
            formatter: (p) => (p.value > 0 ? `${p.value} kg` : '0 kg'),
          },
        },
      ],
    };
  }, [categoryData, maxCategoryKg]);

  const activeAltOption =
    altChartType === 'monthly'
      ? monthlyTrendOption
      : altChartType === 'categoryShare'
      ? categoryShareOption
      : categoryRankingOption;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
        alignItems: 'start',
      }}
    >
      {/* Chart 1: User Registration Approvals Donut */}
      <div
        style={{
          background: '#1E293B',
          borderRadius: '20px',
          padding: '1.5rem',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          height: '450px',
          maxHeight: '450px',
          minHeight: '450px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', height: '40px', flexShrink: 0 }}>
          <div>
            <h4 style={{ margin: 0, color: '#FFF', fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
              User Registration Approvals
            </h4>
            <p style={{ margin: '0.2rem 0 0 0', color: '#94A3B8', fontSize: '0.78rem' }}>
              Account status &amp; onboarding pipeline
            </p>
          </div>
        </div>

        {/* Fixed Height Chart Container */}
        <div style={{ width: '100%', height: '345px', flexShrink: 0 }}>
          <ReactECharts option={donutOption} style={{ height: '345px', width: '100%' }} notMerge={true} />
        </div>
      </div>

      {/* Chart 2: Flexible Alternative Chart with Compact Segmented Control */}
      <div
        style={{
          background: '#1E293B',
          borderRadius: '20px',
          padding: '1.5rem',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          height: '450px',
          maxHeight: '450px',
          minHeight: '450px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Header with Segmented Switcher */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            height: '40px',
            flexShrink: 0,
            gap: '0.5rem',
          }}
        >
          <div style={{ overflow: 'hidden' }}>
            <h4 style={{ margin: 0, color: '#FFF', fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {altChartType === 'monthly'
                ? 'System Monthly Trend'
                : altChartType === 'categoryShare'
                ? 'Platform Sector Share'
                : 'Sector Emission Rankings'}
            </h4>
            <p style={{ margin: '0.2rem 0 0 0', color: '#94A3B8', fontSize: '0.78rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {altChartType === 'monthly'
                ? 'Total CO₂e volume logged by month (kg)'
                : altChartType === 'categoryShare'
                ? 'Activity volume share across sectors'
                : 'Total emissions logged per sector (kg)'}
            </p>
          </div>

          {/* Compact Segmented Control */}
          <div
            style={{
              display: 'inline-flex',
              background: '#0F172A',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.08)',
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setAltChartType('monthly')}
              style={{
                background: altChartType === 'monthly' ? '#10B981' : 'transparent',
                color: altChartType === 'monthly' ? '#FFF' : '#94A3B8',
                border: 'none',
                borderRadius: '7px',
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Monthly System Trend"
            >
              📅 Monthly
            </button>
            <button
              onClick={() => setAltChartType('categoryShare')}
              style={{
                background: altChartType === 'categoryShare' ? '#10B981' : 'transparent',
                color: altChartType === 'categoryShare' ? '#FFF' : '#94A3B8',
                border: 'none',
                borderRadius: '7px',
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Sector Share %"
            >
              🍕 Sectors
            </button>
            <button
              onClick={() => setAltChartType('categoryRanking')}
              style={{
                background: altChartType === 'categoryRanking' ? '#10B981' : 'transparent',
                color: altChartType === 'categoryRanking' ? '#FFF' : '#94A3B8',
                border: 'none',
                borderRadius: '7px',
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Sector Emission Rankings"
            >
              📊 Ranking
            </button>
          </div>
        </div>

        {/* Fixed Height Chart Container */}
        <div style={{ width: '100%', height: '345px', flexShrink: 0 }}>
          <ReactECharts option={activeAltOption} style={{ height: '345px', width: '100%' }} notMerge={true} />
        </div>
      </div>
    </div>
  );
}
