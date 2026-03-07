import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../lib/api';

interface PipelineResult {
    success: boolean;
    result?: any;
    mode?: string;
    task_id?: string;
    message?: string;
}

interface ModelTrainingResult {
    success: boolean;
    mode: 'queued' | 'inline';
    task_id?: string;
    lapse_r2?: number;
    anomaly_accuracy?: number;
    ensemble_accuracy?: number;
}

interface EngineContextType {
    isRunningPipeline: boolean;
    isTrainingModels: boolean;
    isSeedingData: boolean;
    lastPipelineResult: PipelineResult | null;
    lastTrainingResult: ModelTrainingResult | null;
    error: string | null;
    runPipeline: () => Promise<PipelineResult>;
    retrainModels: () => Promise<ModelTrainingResult>;
    seedDatabase: () => Promise<void>;
}

const EngineContext = createContext<EngineContextType>({} as EngineContextType);

export const EngineProvider = ({ children }: { children: ReactNode }) => {
    const [isRunningPipeline, setIsRunningPipeline] = useState(false);
    const [isTrainingModels, setIsTrainingModels] = useState(false);
    const [isSeedingData, setIsSeedingData] = useState(false);
    const [lastPipelineResult, setLastPipelineResult] = useState<PipelineResult | null>(null);
    const [lastTrainingResult, setLastTrainingResult] = useState<ModelTrainingResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const runPipeline = async (): Promise<PipelineResult> => {
        setIsRunningPipeline(true);
        setError(null);
        try {
            const response = await api.post('/internal/run-pipeline');
            const result: PipelineResult = response.data;
            setLastPipelineResult(result);
            return result;
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to run pipeline';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setIsRunningPipeline(false);
        }
    };

    const retrainModels = async (): Promise<ModelTrainingResult> => {
        setIsTrainingModels(true);
        setError(null);
        try {
            const response = await api.post('/internal/retrain-model');
            const result: ModelTrainingResult = response.data;
            setLastTrainingResult(result);
            return result;
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to retrain models';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setIsTrainingModels(false);
        }
    };

    const seedDatabase = async (): Promise<void> => {
        setIsSeedingData(true);
        setError(null);
        try {
            await api.post('/internal/seed-data');
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to seed database';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setIsSeedingData(false);
        }
    };

    return (
        <EngineContext.Provider
            value={{
                isRunningPipeline,
                isTrainingModels,
                isSeedingData,
                lastPipelineResult,
                lastTrainingResult,
                error,
                runPipeline,
                retrainModels,
                seedDatabase,
            }}
        >
            {children}
        </EngineContext.Provider>
    );
};

export const useEngine = () => {
    const context = useContext(EngineContext);
    if (!context) {
        throw new Error('useEngine must be used within an EngineProvider');
    }
    return context;
};
