import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { weeklyChartStyles as styles } from './WeeklyChart.styles';
import { colors } from '../../../theme';
import { formatPrice } from '../../../config/constants';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 64; // padding horizontal
const CHART_HEIGHT = 160;

const WeeklyChart = ({ data, title, totalRevenue, evolution }) => {
    const isPositive = evolution >= 0;

    // Jours de la semaine (L, M, M, J, V, S, D)
    const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

    // Préparer les données pour le graphique (7 derniers jours)
    const chartData = prepareChartData(data);

    // Générer le path SVG
    const pathData = generatePath(chartData);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.subtitle}>{title}</Text>
                    <Text style={styles.totalValue}>{formatPrice(totalRevenue)}</Text>
                </View>
                <View style={[styles.evolutionBadge, isPositive ? styles.evolutionPositive : styles.evolutionNegative]}>
                    <Text style={[styles.evolutionLabel, isPositive ? styles.evolutionLabelPositive : styles.evolutionLabelNegative]}>
                        Cette semaine
                    </Text>
                    <Text style={[styles.evolutionValue, isPositive ? styles.evolutionValuePositive : styles.evolutionValueNegative]}>
                        {isPositive ? '+' : ''}{evolution}%
                    </Text>
                </View>
            </View>

            {/* Chart */}
            <View style={styles.chartContainer}>
                <Svg width={CHART_WIDTH} height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
                    <Defs>
                        <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={colors.primary.bright} stopOpacity="0.2" />
                            <Stop offset="1" stopColor={colors.primary.bright} stopOpacity="0" />
                        </LinearGradient>
                    </Defs>

                    {/* Area */}
                    <Path d={pathData.area} fill="url(#gradient)" />

                    {/* Line */}
                    <Path
                        d={pathData.line}
                        stroke={colors.primary.bright}
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                    />
                </Svg>
            </View>

            {/* Day Labels */}
            <View style={styles.labelsContainer}>
                {dayLabels.map((label, index) => (
                    <Text key={index} style={styles.dayLabel}>{label}</Text>
                ))}
            </View>
        </View>
    );
};

// Preparer les donnees pour le graphique (toujours 7 jours)
const prepareChartData = (data) => {
    // Initialiser avec 7 jours a 0
    const result = Array(7).fill(0);
    
    if (!data || data.length === 0) {
        return result;
    }

    // Prendre les 7 derniers jours et inverser pour avoir du plus ancien au plus recent
    const last7Days = data.slice(0, 7).reverse();
    
    // Remplir les donnees disponibles
    last7Days.forEach((day, index) => {
        result[index] = parseFloat(day.revenusJour) || 0;
    });

    return result;
};

// Generer le path SVG pour le graphique
const generatePath = (data) => {
    const maxValue = Math.max(...data, 1);
    const numPoints = data.length;
    
    // Eviter la division par zero
    const stepX = numPoints > 1 ? CHART_WIDTH / (numPoints - 1) : CHART_WIDTH / 2;
    const padding = 20;

    let linePath = '';
    let areaPath = '';

    data.forEach((value, index) => {
        const x = numPoints > 1 ? index * stepX : CHART_WIDTH / 2;
        const y = CHART_HEIGHT - padding - ((value / maxValue) * (CHART_HEIGHT - padding * 2));

        if (index === 0) {
            linePath = `M ${x} ${y}`;
            areaPath = `M ${x} ${CHART_HEIGHT - padding} L ${x} ${y}`;
        } else {
            linePath += ` L ${x} ${y}`;
            areaPath += ` L ${x} ${y}`;
        }
    });

    // Fermer le path de l'area
    areaPath += ` L ${CHART_WIDTH} ${CHART_HEIGHT - padding} Z`;

    return { line: linePath, area: areaPath };
};

export default WeeklyChart;
