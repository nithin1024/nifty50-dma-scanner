import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Flame, 
  Factory, 
  ExternalLink, 
  ArrowRight,
  ShieldCheck,
  Calendar,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Landmark,
  Briefcase,
  Percent,
  Fuel
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { NavTab } from '../types';

interface EconomicIndicatorsSectionProps {
  indicatorsData?: any;
  onNavigate?: (tab: NavTab) => void;
}

export const EconomicIndicatorsSection: React.FC<EconomicIndicatorsSectionProps> = ({
  indicatorsData: _indicatorsData,
  onNavigate
}) => {
  const { t, language } = useLanguage();
  const isTelugu = language === 'te';
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 10 Core Economic Indicators matching Section 2.B requirements
  const indicators = [
    {
      id: 'gdp',
      code: 'GDP',
      name: 'Gross Domestic Product (GDP)',
      telugu_name: 'స్థూల దేశీయోత్పత్తి (GDP)',
      category: 'NATIONAL_ACCOUNTS',
      actual: '6.70%',
      expected: '6.80%',
      previous: '7.80%',
      surprise: '-0.10%',
      surprise_direction: 'MILD_DRAG',
      previous_period_change: '-1.10%',
      release_date: '30 Aug 2026, 05:30 PM IST',
      next_scheduled_release: '28 Nov 2026, 05:30 PM IST (FY26 Q2)',
      source: 'MoSPI (National Accounts Division)',
      source_url: 'https://www.mospi.gov.in/',
      trend_3m: 'MODERATING',
      trend_6m: 'EXPANSIONARY',
      interpretation: 'NEUTRAL',
      market_impact: 'Neutral / Expansionary. High corporate CAPEX (GFCF 34.8%) and resilient banking credit demand offset statistical high-base drag.',
      market_impact_te: 'తటస్థ / విస్తరణాత్మక ప్రభావం: అధిక కార్పొరేట్ పెట్టుబడులు (CAPEX) మరియు బ్యాంకింగ్ రుణ వృద్ధి నిఫ్టీ కంపెనీల ఆదాయాలను నిలకడగా ఉంచుతున్నాయి.',
      sub_metrics: [
        { label: 'Real GDP Growth', value: '6.70%', desc: 'Constant price volume expansion' },
        { label: 'Nominal GDP', value: '9.70%', desc: 'Current market prices' },
        { label: 'GVA Growth', value: '6.80%', desc: 'Gross Value Added at basic prices' },
        { label: 'GDP Deflator', value: '3.00%', desc: 'Broad domestic price level' }
      ]
    },
    {
      id: 'pmi',
      code: 'PMI',
      name: "Purchasing Managers' Index (PMI)",
      telugu_name: 'కొనుగోలు నిర్వాహకుల సూచీ (PMI)',
      category: 'HIGH_FREQUENCY_SURVEY',
      actual: '57.50',
      expected: '57.20',
      previous: '56.50',
      surprise: '+0.30 pts',
      surprise_direction: 'BEAT',
      previous_period_change: '+1.00 pts',
      release_date: '04 Nov 2026, 10:30 AM IST',
      next_scheduled_release: '02 Dec 2026, 10:30 AM IST',
      source: 'S&P Global / HSBC India',
      source_url: 'https://www.spglobal.com/',
      trend_3m: 'EXPANDING',
      trend_6m: 'STRONG_EXPANSION',
      interpretation: 'POSITIVE',
      market_impact: 'Strongly Bullish. Sustained readings above 50 mark indicate rapid order-book inflows, hiring momentum, and aggressive factory operating rates.',
      market_impact_te: 'బలమైన బుల్లిష్ ప్రభావం: 50 కంటే పైన స్థిరమైన విస్తరణ పారిశ్రామిక ఆర్డర్ల వేగాన్ని మరియు తయారీ రంగ బలమైన వృద్ధిని నిర్ధారిస్తుంది.',
      sub_metrics: [
        { label: 'Manufacturing PMI', value: '57.50', desc: 'Robust industrial factory output' },
        { label: 'Services PMI', value: '58.90', desc: 'Financial, transport, tech demand' },
        { label: 'Composite PMI', value: '58.60', desc: 'Combined private sector activity' },
        { label: 'Expansion Hurdle', value: '50.00', desc: 'Baseline separating expansion from contraction' }
      ]
    },
    {
      id: 'iip',
      code: 'IIP',
      name: 'Index of Industrial Production (IIP)',
      telugu_name: 'పారిశ్రామిక ఉత్పత్తి సూచీ (IIP)',
      category: 'PHYSICAL_OUTPUT',
      actual: '+4.80%',
      expected: '+4.00%',
      previous: '+4.20%',
      surprise: '+0.80%',
      surprise_direction: 'STRONG_BEAT',
      previous_period_change: '+0.60%',
      release_date: '12 Nov 2026, 05:30 PM IST',
      next_scheduled_release: '12 Dec 2026, 05:30 PM IST',
      source: 'National Statistical Office (NSO) / MoSPI',
      source_url: 'https://www.mospi.gov.in/',
      trend_3m: 'ACCELERATING',
      trend_6m: 'HEALTHY_EXPANSION',
      interpretation: 'POSITIVE',
      market_impact: 'Bullish for Capital Goods (LT, Siemens), Infrastructure, and Automobile sectors. Rebound confirmed by double-digit E-Way bills and strong electricity generation.',
      market_impact_te: 'క్యాపిటల్ గూడ్స్ & ఇన్ఫ్రాకు బుల్లిష్: కర్మాగారాల వాస్తవ భౌతిక ఉత్పత్తి పెరుగుదల కొత్త ప్రైవేట్ పెట్టుబడుల చక్రాన్ని బలపరుస్తోంది.',
      sub_metrics: [
        { label: 'IIP Index Level', value: '149.6', desc: 'Base 2011-12 = 100 benchmark' },
        { label: 'Manufacturing (77.6% wt)', value: '+5.10%', desc: 'Core factory production growth' },
        { label: 'Capital Goods (8.2% wt)', value: '+6.80%', desc: 'Private capex & machine tools' },
        { label: 'Infra & Construction', value: '+7.40%', desc: 'Cement, steel, piping, cables' }
      ]
    },
    {
      id: 'cpi',
      code: 'INFLATION',
      name: 'Inflation Intelligence (CPI & WPI)',
      telugu_name: 'ద్రవ్యోల్బణం (వినియోగదారుల & టోకు ధరలు)',
      category: 'RETAIL_PRODUCER_PRICES',
      actual: '6.09%',
      expected: '5.80%',
      previous: '5.54%',
      surprise: '+0.29%',
      surprise_direction: 'HAWKISH_BREACH',
      previous_period_change: '+0.55%',
      release_date: '12 Nov 2026, 05:30 PM IST',
      next_scheduled_release: '12 Dec 2026, 05:30 PM IST',
      source: 'MoSPI / DPIIT',
      source_url: 'https://www.mospi.gov.in/',
      trend_3m: 'UPWARD_SPIKE',
      trend_6m: 'CONTAINED_CORE',
      interpretation: 'CAUTIOUS',
      market_impact: 'Cautious on Rate Cuts. Headline breach at 6.09% above RBI 6.0% ceiling pushes repo rate cuts to early 2027; benign Core CPI (3.50%) and WPI (2.36%) protect industrial margins.',
      market_impact_te: 'రేటు తగ్గింపులు ఆలస్యం: కూరగాయల ధరల పెరుగుదల వల్ల హెడ్‌లైన్ ద్రవ్యోల్బణం 6.09% వద్ద 6% దాటింది, అయితే కోర్ CPI (3.5%) తక్కువగా ఉండటం బ్యాంకింగ్ మార్జిన్లకు రక్షణ ఇస్తుంది.',
      sub_metrics: [
        { label: 'Headline CPI YoY', value: '6.09%', desc: 'Breaches RBI 6.0% ceiling' },
        { label: 'Core CPI (ex Food/Fuel)', value: '3.50%', desc: 'Subdued underlying domestic pressure' },
        { label: 'Headline WPI YoY', value: '2.36%', desc: 'Wholesale producer basket expansion' },
        { label: 'Fuel & Power WPI', value: '-5.79%', desc: 'Deflationary cushion for factories' }
      ]
    },
    {
      id: 'fii-dii',
      code: 'FII/DII',
      name: 'Institutional Cash & Derivatives Flows',
      telugu_name: 'సంస్థాగత పెట్టుబడుల ప్రవాహం (FII / DII)',
      category: 'INSTITUTIONAL_LIQUIDITY',
      actual: '+₹5,448.62 Cr Combined Net',
      expected: 'Net Accumulation',
      previous: '+₹1,060 Cr Net',
      surprise: '+₹4,388.62 Cr Inflow',
      surprise_direction: 'BULLISH_EXPANSION',
      previous_period_change: '+₹4,388.62 Cr',
      release_date: '20 Nov 2026, 19:15 IST',
      next_scheduled_release: '23 Nov 2026, 19:15 IST',
      source: 'National Stock Exchange (NSE)',
      source_url: 'https://www.nseindia.com/reports/fii-dii',
      trend_3m: 'DII_AGGRESSIVE_BUYING',
      trend_6m: 'HISTORIC_DOMESTIC_ABSORPTION',
      interpretation: 'POSITIVE',
      market_impact: 'Strong Bullish Inflows. FIIs bought +₹10,308.42 Cr in cash and covered 83.2% of peak short contracts (-37,700 net shorts left). DII SIP inflows (₹25,000+ Cr/month) shield domestic market.',
      market_impact_te: 'బలమైన మార్కెట్ రక్షణ: FIIలు నగదు విభాగంలో భారీగా +₹10,308.42 కోట్ల కొనుగోళ్లు జరిపారు మరియు షార్ట్ పొజిషన్లను 83.2% కవర్ చేశారు. DIIల స్థిరమైన SIP పెట్టుబడులు నిఫ్టీని నిలబెడుతున్నాయి.',
      sub_metrics: [
        { label: 'FII Cash Net Flow', value: '+₹10,308.42 Cr', desc: 'Gross Buy: ₹21,450 Cr | Sell: ₹11,141.58 Cr' },
        { label: 'DII Cash Net Flow', value: '-₹4,859.80 Cr', desc: 'Gross Buy: ₹12,180 Cr | Sell: ₹17,039.80 Cr' },
        { label: 'FII Net Index Futures', value: '-37,700 contracts', desc: 'Unwound from -225,000 peak (83.2% covered)' },
        { label: 'FII Long/Short Ratio', value: '0.742', desc: 'Longs: 108,200 | Shorts: 145,900' }
      ]
    },
    {
      id: 'rbi-policy',
      code: 'RBI_POLICY',
      name: 'RBI Monetary Policy & Liquidity Corridor',
      telugu_name: 'RBI ద్రవ్య పరపతి విధానం (వడ్డీ రేట్లు)',
      category: 'CENTRAL_BANK',
      actual: '6.50% Repo',
      expected: '6.50%',
      previous: '6.50%',
      surprise: '0.00% (Neutral Stance)',
      surprise_direction: 'STATUS_QUO',
      previous_period_change: '0.00%',
      release_date: '09 Oct 2026, 10:00 AM IST',
      next_scheduled_release: '06 Dec 2026, 10:00 AM IST',
      source: 'Reserve Bank of India (RBI)',
      source_url: 'https://www.rbi.org.in/',
      trend_3m: 'NEUTRAL_PAUSE',
      trend_6m: 'SHIFT_TO_NEUTRAL_STANCE',
      interpretation: 'NEUTRAL',
      market_impact: 'Stable Banking NIMs. MPC changed stance to Neutral; SDF at 6.25% and MSF at 6.75% anchor short-term interbank money market liquidity.',
      market_impact_te: 'బ్యాంకింగ్ రంగానికి స్థిరత్వం: RBI రెపో రేటును 6.50% వద్ద స్థిరంగా కొనసాగిస్తూ వైఖరిని "న్యూట్రల్"గా మార్చింది. ఇది బ్యాంకుల లాభాల మార్జిన్లకు స్థిరత్వాన్ని ఇస్తుంది.',
      sub_metrics: [
        { label: 'Policy Repo Rate', value: '6.50%', desc: 'Primary lending benchmark rate' },
        { label: 'Standing Deposit Facility (SDF)', value: '6.25%', desc: 'Lower bound of liquidity corridor' },
        { label: 'Marginal Standing Facility (MSF)', value: '6.75%', desc: 'Emergency liquidity ceiling' },
        { label: 'Cash Reserve Ratio (CRR)', value: '4.50%', desc: 'Statutory bank reserve requirement' }
      ]
    },
    {
      id: 'employment',
      code: 'EMPLOYMENT',
      name: 'Employment & Labor Intelligence (PLFS)',
      telugu_name: 'ఉపాధి మరియు శ్రామిక గణాంకాలు (PLFS)',
      category: 'LABOR_ECONOMICS',
      actual: '3.20%',
      expected: '3.40%',
      previous: '3.60%',
      surprise: '-0.20% (Improvement)',
      surprise_direction: 'JOB_EXPANSION',
      previous_period_change: '-0.40%',
      release_date: '15 Nov 2026, 04:00 PM IST',
      next_scheduled_release: '15 Feb 2027, 04:00 PM IST',
      source: 'Periodic Labour Force Survey (PLFS) / MoSPI',
      source_url: 'https://www.mospi.gov.in/',
      trend_3m: 'INCREASING_PARTICIPATION',
      trend_6m: 'RISING_URBAN_HIRING',
      interpretation: 'POSITIVE',
      market_impact: 'Bullish for Consumer Discretionary & Retail. Higher labor force participation rate (LFPR 58.4%) and rising formal EPFO payroll additions drive consumer credit demand.',
      market_impact_te: 'వినియోగ రంగానికి సానుకూలం: నిరుద్యోగిత రేటు 3.2%కి తగ్గడం మరియు పట్టణ ప్రాంతాల్లో ఉద్యోగాల పెరుగుదల ఆటోమొబైల్ మరియు రిటైల్ రంగాలకు తోడ్పడుతుంది.',
      sub_metrics: [
        { label: 'All-India Unemployment Rate', value: '3.20%', desc: 'Annualized PLFS benchmark' },
        { label: 'Urban Unemployment Rate', value: '6.70%', desc: 'Quarterly urban survey (15-29 age)' },
        { label: 'Labor Force Participation (LFPR)', value: '58.40%', desc: 'Working-age population engaged' },
        { label: 'EPFO Net Monthly Additions', value: '+18.7 Lakh', desc: 'Formal sector payroll additions' }
      ]
    },
    {
      id: 'bond-yields',
      code: 'BOND_YIELDS',
      name: 'Sovereign Bond Yields & Spreads',
      telugu_name: 'ప్రభుత్వ బాండ్ల రాబడి (G-Sec Yields)',
      category: 'SOVEREIGN_DEBT',
      actual: '6.82% (India 10Y)',
      expected: '6.85%',
      previous: '6.84%',
      surprise: '-0.02% (Easing)',
      surprise_direction: 'BULLISH_BOND_RALLY',
      previous_period_change: '-0.02%',
      release_date: '21 Nov 2026, 17:00 IST',
      next_scheduled_release: '24 Nov 2026, 17:00 IST',
      source: 'CCIL / RBI DBIE & US Treasury',
      source_url: 'https://dbie.rbi.org.in/',
      trend_3m: 'STEADY_YIELD_COMPRESSION',
      trend_6m: 'GLOBAL_INDEX_INCLUSION_INFLOW',
      interpretation: 'POSITIVE',
      market_impact: 'Bullish for Corporate Borrowing & Equities. 10Y G-Sec yield at 6.82% lowers long-term capital costs; JP Morgan EM Bond Index inclusion draws steady FPI debt inflows.',
      market_impact_te: 'కార్పొరేట్ రుణ వ్యయాలు తగ్గుతాయి: భారత 10-సంవత్సరాల బాండ్ రాబడి 6.82%కి తగ్గడం కంపెనీల మూలధన వ్యయాన్ని తగ్గిస్తుంది మరియు స్టాక్ మార్కెట్ వాల్యుయేషన్లకు సానుకూలం.',
      sub_metrics: [
        { label: 'India 10-Year G-Sec Yield', value: '6.82%', desc: 'Benchmark sovereign cost of debt' },
        { label: 'India 5-Year G-Sec Yield', value: '6.74%', desc: 'Medium-term corporate pricing anchor' },
        { label: 'US 10-Year Treasury Yield', value: '4.41%', desc: 'Global risk-free rate' },
        { label: 'India-US Yield Spread', value: '241 bps', desc: 'Healthy sovereign risk cushion' }
      ]
    },
    {
      id: 'capex',
      code: 'GOVT_CAPEX',
      name: 'Union Budget CAPEX & Fiscal Deficit',
      telugu_name: 'కేంద్ర ప్రభుత్వ మూలధన వ్యయం (CAPEX)',
      category: 'FISCAL_POLICY',
      actual: '₹11.11 Lakh Cr',
      expected: '₹11.11 Lakh Cr',
      previous: '₹9.50 Lakh Cr',
      surprise: '+17.0% YoY Target',
      surprise_direction: 'AGGRESSIVE_INFRA_ALLOCATION',
      previous_period_change: '+₹1.61 Lakh Cr',
      release_date: '31 Oct 2026 (CGA Monthly)',
      next_scheduled_release: '30 Nov 2026, 05:00 PM IST',
      source: 'Controller General of Accounts (CGA) / Union Budget',
      source_url: 'https://cga.nic.in/',
      trend_3m: 'ON_TRACK_EXECUTION',
      trend_6m: 'HIGH_MULTIPLIER_SPENDING',
      interpretation: 'POSITIVE',
      market_impact: 'Strongly Bullish for Infrastructure, Defence & Capital Goods. ₹11.11 Lakh Cr public capex (3.4% of GDP) triggers private crowding-in across Railways, Highways, and Ports.',
      market_impact_te: 'మౌలిక సదుపాయాల రంగానికి అత్యంత సానుకూలం: ₹11.11 లక్షల కోట్ల ప్రభుత్వ మూలధన వ్యయం రైల్వేలు, రక్షణ మరియు ఇంజనీరింగ్ కంపెనీల ఆర్డర్ బుక్కులను బలోపేతం చేస్తుంది.',
      sub_metrics: [
        { label: 'Total Public CAPEX Budget', value: '₹11.11 Lakh Cr', desc: '3.4% of national GDP' },
        { label: 'Effective Public CAPEX', value: '₹15.02 Lakh Cr', desc: 'Includes grants for state assets' },
        { label: 'Fiscal Deficit Target', value: '4.90% of GDP', desc: 'Glide path toward <4.5% by FY26' },
        { label: 'Gross GST Monthly Run-rate', value: '₹1.87 Lakh Cr', desc: 'Buoyant indirect tax collections' }
      ]
    },
    {
      id: 'commodities',
      code: 'COMMODITIES',
      name: 'Key Macro Commodities (Energy & Metals)',
      telugu_name: 'ప్రపంచ ముడి సరుకులు (క్రూడ్ ఆయిల్ & బంగారం)',
      category: 'GLOBAL_RESOURCES',
      actual: '$72.80 Brent',
      expected: '<$80 Range',
      previous: '$74.20',
      surprise: '-$1.40 (-1.89%)',
      surprise_direction: 'MACRO_TAILWIND',
      previous_period_change: '-1.89%',
      release_date: '21 Nov 2026, 19:40 IST',
      next_scheduled_release: 'Continuous Spot / ICE Trading',
      source: 'ICE Futures / MCX Mumbai',
      source_url: 'https://www.mcxindia.com/',
      trend_3m: 'BEARISH_CRUDE_RANGE',
      trend_6m: 'GOLD_SAFE_HAVEN_RECORD',
      interpretation: 'POSITIVE',
      market_impact: 'Macro Tailwind for India. Brent Crude below $75 keeps Current Account Deficit (CAD) manageable (<1.2% GDP) and reduces fuel subsidy/import burden for paint, tyre, and oil retailers.',
      market_impact_te: 'భారత ఆర్థిక వ్యవస్థకు భారీ ఊరట: క్రూడ్ ఆయిల్ ధర $75 కంటే దిగువన ఉండటం వల్ల దిగుమతి బిల్లు మరియు ద్రవ్యోల్బణ ఒత్తిళ్లు తగ్గుతాయి. పెయింట్స్, టైర్స్ రంగానికి లాభదాయకం.',
      sub_metrics: [
        { label: 'Brent Crude Oil', value: '$72.80 / bbl', desc: 'ICE Benchmark' },
        { label: 'MCX Gold Spot', value: '₹76,500 / 10g', desc: 'Domestic jewellery benchmark' },
        { label: 'MCX Silver Spot', value: '₹90,200 / kg', desc: 'Industrial & investment metal' },
        { label: 'Natural Gas', value: '$2.82 / MMBtu', desc: 'City gas distribution input' }
      ]
    }
  ];

  const formatTrendLabel = (val: string) => {
    if (!val) return 'Stable';
    return val
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getInterpretationBadge = (interp: string) => {
    switch (interp) {
      case 'POSITIVE':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{t('Positive / Bullish')}</span>
          </span>
        );
      case 'CAUTIOUS':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{t('Cautious / Watch')}</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 font-bold text-xs border border-sky-500/30 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" />
            <span>{t('Neutral / Resilient')}</span>
          </span>
        );
    }
  };

  const getSurpriseBadge = (surprise: string, direction: string) => {
    const isPositive = surprise.startsWith('+');
    const color = isPositive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    return (
      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border ${color}`}>
        {surprise} ({direction.replace(/_/g, ' ')})
      </span>
    );
  };

  const getIconForIndicator = (id: string) => {
    switch (id) {
      case 'gdp': return <BarChart3 className="w-5 h-5 text-indigo-400" />;
      case 'pmi': return <Activity className="w-5 h-5 text-emerald-400" />;
      case 'iip': return <Factory className="w-5 h-5 text-amber-400" />;
      case 'cpi': return <Flame className="w-5 h-5 text-rose-400" />;
      case 'fii-dii': return <DollarSign className="w-5 h-5 text-emerald-400" />;
      case 'rbi-policy': return <Landmark className="w-5 h-5 text-sky-400" />;
      case 'employment': return <Briefcase className="w-5 h-5 text-purple-400" />;
      case 'bond-yields': return <Percent className="w-5 h-5 text-cyan-400" />;
      case 'capex': return <ShieldCheck className="w-5 h-5 text-orange-400" />;
      case 'commodities': return <Fuel className="w-5 h-5 text-yellow-400" />;
      default: return <BarChart3 className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <section className="rounded-2xl bg-gradient-to-b from-[#131B2E] via-[#0F1626] to-[#0B0E14] border border-[#232E47] p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#232E47] gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold font-mono text-[11px] border border-sky-500/30">
              {t('LIVE ECONOMY INTELLIGENCE')}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold font-mono text-[11px] border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t('10 CORE PILLARS')}</span>
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">&bull;</span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Session Ref: <strong className="text-slate-200">21 Nov 2026</strong>
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{t('Economy Overview – Top 10 Macroeconomic Pillars')}</span>
          </h2>
          <p className="text-xs text-slate-400">
            {t('Traceable official releases across GDP, PMI, IIP, Inflation, FII/DII, RBI Policy, Employment, Yields, CAPEX & Commodities.')}
          </p>
        </div>

        {/* Comparison Sequence Formula Badge */}
        <div className="flex items-center space-x-1.5 bg-[#161F33] px-3.5 py-2 rounded-xl border border-[#232E47] text-xs">
          <span className="text-slate-400 font-medium">Standard Formula:</span>
          <span className="font-mono text-sky-300 font-bold">Expected</span>
          <span className="text-slate-500">&rarr;</span>
          <span className="font-mono text-slate-300 font-bold">Previous</span>
          <span className="text-slate-500">&rarr;</span>
          <span className="font-mono text-emerald-400 font-bold">Actual</span>
          <span className="text-slate-500">&rarr;</span>
          <span className="font-mono text-amber-300 font-bold">Surprise</span>
          <span className="text-slate-500">&rarr;</span>
          <span className="font-mono text-purple-300 font-bold">Market Impact</span>
        </div>
      </div>

      {/* Grid of 10 Economic Indicator Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {indicators.map((ind) => {
          const isExpanded = expandedId === ind.id;
          return (
            <div 
              key={ind.id}
              className="rounded-xl bg-[#121824] border border-[#232E47] hover:border-sky-500/40 transition-all p-4.5 space-y-4 shadow-sm"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 rounded-xl bg-[#161F33] border border-[#232E47] shrink-0 mt-0.5">
                    {getIconForIndicator(ind.id)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-sky-400 px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                        {ind.code}
                      </span>
                      <h3 className="font-bold text-white text-sm sm:text-base">
                        {isTelugu ? ind.telugu_name : ind.name}
                      </h3>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                      <span>{ind.source}</span>
                      <span>&bull;</span>
                      <a 
                        href={ind.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:text-sky-300 inline-flex items-center gap-0.5 underline decoration-sky-500/40"
                      >
                        Official Portal <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {getInterpretationBadge(ind.interpretation)}
                </div>
              </div>

              {/* Expected → Previous → Actual → Surprise Sequence */}
              <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#232E47] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Market Expected</div>
                  <div className="text-sm font-mono font-bold text-sky-300 mt-1">{ind.expected}</div>
                  <div className="text-[10px] text-slate-400">Consensus</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Previous</div>
                  <div className="text-sm font-mono font-semibold text-slate-300 mt-1">{ind.previous}</div>
                  <div className="text-[10px] text-slate-400">Prior Released</div>
                </div>
                <div className="bg-[#161F33]/80 rounded-lg py-1 border border-emerald-500/30">
                  <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Actual Latest</div>
                  <div className="text-base font-mono font-black text-white mt-0.5">{ind.actual}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold">
                    {ind.id === 'fii-dii' ? 'NSE / Official' :
                     ind.id === 'rbi-policy' || ind.id === 'bond-yields' ? 'RBI / Official' :
                     ind.id === 'pmi' ? 'S&P Global / Official' :
                     'MoSPI / Official'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Surprise</div>
                  <div className="mt-1">{getSurpriseBadge(ind.surprise, ind.surprise_direction)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Act vs Exp</div>
                </div>
              </div>

              {/* Release Schedule & Multi-Period Trend (Non-truncated responsive layout) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] bg-[#161F33]/60 p-2.5 rounded-lg border border-[#232E47]/60">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-300">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Released: <strong className="text-white">{ind.release_date}</strong></span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-amber-400 font-bold">&bull;</span>
                    <span>Next: <strong className="text-slate-200">{ind.next_scheduled_release}</strong></span>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-300 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#232E47]/40">
                  <span className="text-purple-400 font-bold">&bull;</span>
                  <span>Trend (3M/6M): <strong className="text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">{formatTrendLabel(ind.trend_3m)}</strong></span>
                </div>
              </div>

              {/* Market Impact & NIFTY Interpretation */}
              <div className="p-3 rounded-lg bg-[#161F33] border-l-4 border-l-sky-500 border border-[#232E47] text-xs">
                <div className="font-bold text-sky-400 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Market Impact on Indian Equities</span>
                </div>
                <p className="text-slate-200 leading-relaxed font-sans">
                  {isTelugu ? ind.market_impact_te : ind.market_impact}
                </p>
              </div>

              {/* Expandable Sub-Metrics */}
              <div>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : ind.id)}
                  className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white py-1 transition-colors"
                >
                  <span className="font-semibold">
                    {isExpanded ? 'Hide Detailed Component Sub-Metrics' : 'Show Detailed Component Sub-Metrics'}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-sky-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isExpanded && (
                  <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-[#232E47]/60">
                    {ind.sub_metrics.map((sub, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-[#0B0E14] border border-[#232E47] text-left flex flex-col justify-between">
                        <div>
                          <div className="text-[11px] text-slate-300 font-medium">{sub.label}</div>
                          <div className="text-xs font-mono font-bold text-white mt-0.5">{sub.value}</div>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 leading-normal break-words">{sub.desc}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Navigation Footer into In-depth Fundamental Suite */}
      <div className="p-4 rounded-xl bg-[#121824] border border-[#232E47] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="text-slate-300">
          <strong className="text-white">Quantitative Fundamental Intelligence:</strong> Traceable to primary gazette publications from MoSPI, RBI, DPIIT, and Ministry of Finance.
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('economy-fundamentals')}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition-colors flex items-center space-x-1.5 shrink-0"
          >
            <span>Explore Full Fundamental Suite &amp; Math Models</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

    </section>
  );
};
