import { Router } from "express";



import { createNewChat, deleteChat, getAvailableModels, getIndividualChatDetails, getUserChats, streamChatResponse, updatePrevChat } from "../controllers/chat.controller";

const router = Router();



router.post("/", createNewChat);

router.get("/models", getAvailableModels);

router.post("/stream", streamChatResponse);

router.post("/:id/messages", updatePrevChat);

router.get("/user/:userId", getUserChats);

router.get("/:id", getIndividualChatDetails);

router.delete("/:id", deleteChat);

export default router;
