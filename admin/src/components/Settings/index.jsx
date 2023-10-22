import React, { useState, useEffect, useRef } from "react";
import { useIntl } from "react-intl";
import { Helmet } from "react-helmet";
import axios from "axios";
import { auth, useNotification } from "@strapi/helper-plugin";
import {
  Layout,
  Button,
  HeaderLayout,
  ContentLayout,
  Grid,
  GridItem,
  Box,
  TextInput,
  Main,
  SingleSelect,
  SingleSelectOption,
  Typography,
  Link,
} from "@strapi/design-system";

import { Check, ExternalLinkIcon } from "@strapi/icons";

const AiModels = [
  {
    value: "text-davinci-003",
    label: "higher quality, longer output, better instruction following",
  },
  {
    value: "text-curie-001",
    label: "faster and lower cost, suited for Q&A, translation, service bot",
  },
];

const AiBackends = [
  {
    id: "open_ai",
    name: "Open AI",
    customUrlAllowed: true,
    defaultUrl: "https://api.openai.com/v1",
    customUrlRequired: false,
    requireCustomModelName: false,
    defaultModels: [
      {
        value: "text-davinci-003",
        label: "higher quality, longer output, better instruction following",
      },
      {
        value: "text-curie-001",
        label:
          "faster and lower cost, suited for Q&A, translation, service bot",
      },
    ],
  },
  {
    id: "azure_ai",
    name: "Azure AI",
    customUrlAllowed: true,
    customUrlRequired: true,
    defaultUrl: "https://azure-endpoint-name.openai.azure.com/",
  },
];
const Settings = () => {
  const { formatMessage } = useIntl();
  const toggleNotification = useNotification();
  const [loading, setLoading] = useState(false);
  const apiKeyRef = useRef("");
  const modelNameRef = useRef("text-davinci-003");
  const backendRef = useRef("azure_ai");
  const maxTokensRef = useRef(2048);

  const instance = axios.create({
    baseURL: process.env.STRAPI_ADMIN_BACKEND_URL,
    headers: {
      Authorization: `Bearer ${auth.getToken()}`,
      "Content-Type": "application/json",
    },
  });

  const [chatGPTConfig, setChatGPTConfig] = useState({
    apiKey: "",
    modelName: "text-davinci-003",
    backend: "open_ai",
    backendConf: {
      url: "",
    },
    maxTokens: 2048,
  });

  const setData = (data) => {
    setChatGPTConfig(data);
    // update the refs
    apiKeyRef.current = data.apiKey;
    modelNameRef.current = data.modelName;
    maxTokensRef.current = data.maxTokens;
    backendRef.current = data.backend;
  };

  const handleChatGPTConfigChange = (key) => (e) => {
    // update the refs
    if (key === "modelName" || key === "backendApi") {
      setChatGPTConfig({
        ...chatGPTConfig,
        [key]: e,
      });
    } else {
      setChatGPTConfig({
        ...chatGPTConfig,
        [key]: e.target.value,
      });
    }

    switch (key) {
      case "backendApi":
        backendRef.current = e;
        break;
      case "apiKey":
        apiKeyRef.current = e.target.value;
        break;
      case "modelName":
        modelNameRef.current = e;
        break;
      case "maxTokens":
        maxTokensRef.current = e.target.value;
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    setLoading(true);
    const fetchChatGPTConfig = async () => {
      try {
        const { data } = await instance.get("/strapi-chatgpt/config");
        setData(data);
      } catch (error) {
        console.log(error);
        toggleNotification({
          type: "warning",
          message: {
            id: "chatgpt-config-fetch-error",
            defaultMessage: "Error while fetching the chatGPT configurations",
          },
        });
      }
    };
    fetchChatGPTConfig();
    setLoading(false);
  }, []);

  const handelSave = async () => {
    const config = {
      apiKey: apiKeyRef.current,
      modelName: modelNameRef.current,
      maxTokens: maxTokensRef.current,
    };

    // check if the api key  entered
    if (!config.apiKey) {
      toggleNotification({
        type: "warning",
        message: {
          id: "chatgpt-config-api-key-required",
          defaultMessage: "Please enter the api key",
        },
      });
      return;
    }
    setLoading(true);

    try {
      const { data } = await instance.post("/strapi-chatgpt/config/update", {
        ...chatGPTConfig,
      });
      if (data && data.value) {
        setData(JSON.parse(data.value));
      }
      setLoading(false);
      toggleNotification({
        type: "success",
        message: {
          id: "chatgpt-config-save-success",
          defaultMessage: "ChatGPT configurations saved successfully",
        },
      });
    } catch (error) {
      setLoading(false);
      console.log(error);
      toggleNotification({
        type: "warning",
        message: {
          id: "chatgpt-config-save-error",
          defaultMessage: "Error while saving the chatGPT configurations",
        },
      });
    }
  };

  return (
    <Layout>
      <Helmet title={"Strapi ChatGPT Configuration"} />
      <Main aria-busy={false}>
        <HeaderLayout
          title={"ChatGPT Configurations"}
          subtitle={formatMessage({
            id: "chatgpt-config-headder",
            defaultMessage:
              "Configure the api key, model name and other parameters",
          })}
          primaryAction={
            <Button
              startIcon={<Check />}
              onClick={handelSave}
              loading={loading}
            >
              Save
            </Button>
          }
        />

        <ContentLayout>
          <Box
            shadow="tableShadow"
            background="neutral0"
            paddingTop={6}
            paddingLeft={7}
            paddingRight={7}
            paddingBottom={6}
            hasRadius
          >
            <Grid gap={6}>
              <GridItem col={3}>
                <SingleSelect
                  name="backendApi"
                  id="backendApi"
                  label="Backend"
                  placeholder="Select a backend"
                  refs={backendRef}
                  value={chatGPTConfig.backend ?? "open_ai"}
                  onChange={handleChatGPTConfigChange("backendApi")}
                >
                  {AiBackends.map((backend) => (
                    <SingleSelectOption key={backend.id} value={backend.name}>
                      {backend.name}
                    </SingleSelectOption>
                  ))}
                </SingleSelect>
              </GridItem>
              <GridItem col={6}>
                <TextInput
                  type="text"
                  id="apiKey"
                  name="apiKey"
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  label="API Key"
                  refs={apiKeyRef}
                  value={chatGPTConfig.apiKey}
                  onChange={handleChatGPTConfigChange("apiKey")}
                />
              </GridItem>

            </Grid>

            <Box paddingTop={5}>
              <Grid gap={6}>
              <GridItem col={3}>
                <SingleSelect
                  name="modelName"
                  id="modelName"
                  label="Model Name"
                  placeholder="Select a model"
                  refs={modelNameRef}
                  value={chatGPTConfig.modelName}
                  onChange={handleChatGPTConfigChange("modelName")}
                >
                  {AiModels.map((model) => (
                    <SingleSelectOption key={model.value} value={model.value}>
                      {model.value} - {model.label}
                    </SingleSelectOption>
                  ))}
                </SingleSelect>
              </GridItem>

              <GridItem col={3}>
                <TextInput
                  type="text"
                  id="maxTokens"
                  name="maxTokens"
                  label="Max Tokens"
                  placeholder="2048"
                  refs={maxTokensRef}
                  value={chatGPTConfig.maxTokens}
                  onChange={handleChatGPTConfigChange("maxTokens")}
                />
              </GridItem>
              </Grid>
            </Box>
            <Box paddingTop={5}>
              <Typography>
                You can set additional parameters{" ("}
                <span>
                  <Link
                    href="https://platform.openai.com/docs/api-reference/completions"
                    target="_blank"
                  >
                    ChatGPT doc
                  </Link>
                </span>
                {") "}
                with the API Integration, available from Plugin &gt; ChatGPT
                menu.
              </Typography>
            </Box>
          </Box>
        </ContentLayout>
      </Main>
    </Layout>
  );
};

export default Settings;
