import mongoose from "mongoose";

const checklistSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        tasks: {
            type: [String],
            default: [],
        },
        status: {
            type: String,
            enum: ["draft"],
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
