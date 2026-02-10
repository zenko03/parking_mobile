import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.error}>
                        {this.state.error && this.state.error.toString()}
                    </Text>
                    <Text style={styles.details}>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </Text>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ef4444',
        marginBottom: 10,
    },
    error: {
        fontSize: 14,
        color: '#991b1b',
        marginBottom: 10,
        textAlign: 'center',
    },
    details: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'left',
    },
});

export default ErrorBoundary;
