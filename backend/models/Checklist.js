import mongoose from "mongoose";

const checklistSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        tasks: [
            {
                title: { type: String, required: true },
                completed: { type: Boolean, default: false }
            }
        ],
        status: {
            type: String,
            enum: ["draft", "approved"],
            default: "draft",
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Checklist = mongoose.model("Checklist", checklistSchema);

export default Checklist;
