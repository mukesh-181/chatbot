import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AIModelId, AIModelOption, AvailableModelsResponse } from "@/lib/aiModels";

export const useModels = () => {


    const [availableModels, setAvailableModels] = useState<AIModelOption[]>([]);
    const [selectedModel, setSelectedModel] = useState<AIModelId>("");


  

  useEffect(() => {
    const loadAvailableModels = async () => {
      try {
        const res = await api.get("/chat/models");
        const data = res.data as AvailableModelsResponse;

        setAvailableModels(data.models);

        setSelectedModel((currentModel) => {
          if (
            currentModel &&
            data.models.some((model) => model.id === currentModel)
          ) {
            return currentModel;
          }

          if (
            data.defaultModel &&
            data.models.some((model) => model.id === data.defaultModel)
          ) {
            return data.defaultModel;
          }

          return data.models[0]?.id || "";
        });
      } catch {
        setAvailableModels([]);
      }
    };

    void loadAvailableModels();
  }, []);

  return { availableModels, selectedModel, setSelectedModel };
};