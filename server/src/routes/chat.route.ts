import { Router } from "express";



import { createNewChat, deleteChat, getIndividualChatDetails, getUserChats, updatePrevChat } from "../controllers/chat.controller";

const router = Router();



router.post("/", createNewChat);

router.post("/:id/messages", updatePrevChat);

router.get("/user/:userId", getUserChats);

router.get("/:id", getIndividualChatDetails);

router.delete("/:id", deleteChat);

export default router;
