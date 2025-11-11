import prisma from '../configs/prisma.js'
import { getAuth } from "@clerk/express";


// Get all workspaces for User
export const getUserWorkspaces = async (req, res) => {
    try {
        // const userId = await req.auth();
        const { userId } = getAuth(req)
        const workspaces = await prisma.workspace.findMany({
            where: {
                members: {some: {userId: userId}}
            },
            include: {
                members: {include: {user: true}},
                projects: {
                    include: {
                        tasks: {include: {assignee: true, comments: {include: {user: true}}}},
                        members: {include: {user: true}}
                    }
                },
                owner: true
            }
        });
        res.status(200).json(workspaces);
    } catch (error) {
        console.log("Error fetching user workspaces:", error);
        res.status(500).json({ message: error.code || error.message });
    }
}

// Add member to workspace
export const addMember = async (req, res) => {
    try {
        const userId = await req.auth();
        const { email, role, workspaceId, message } = req.body;

        // Check if user exists
        const user = await prisma.user.findUnique({where: {email}});

        if(!user){
            return res.status(404).json({ message: "User with the provided email does not exist." });
        }

        if(!workspaceId || !role){
            return res.status(400).json({ message: "Workspace ID and role are required." });
        }

        if(!['ADMIN', 'MEMBER'].includes(role)){
            return res.status(400).json({ message: "Invalid role. Must be either 'ADMIN' or 'MEMBER'." });
        }

        // Fetch workspace
        const workspace = await prisma.workspace.findUnique({where: {id: workspaceId}, include: {members: true}});
        
        if(!workspace){
            return res.status(404).json({ message: "Workspace not found." });
        }

        // Check if Creator has ADMIN role
        if(!workspace.members.find(m => m.userId === userId && m.role === 'ADMIN')){
            return res.status(401).json({ message: "Only ADMIN can add new members to the workspace." });
        }

        // Check if user is already a member
        const existingMember = workspace.members.find(m => m.userId === userId);

        if(existingMember){
            return res.status(400).json({ message: "User is already a member" });
        }
        
        const member = await prisma.workspaceMember.create({
            data: {
                userId: user.id,
                workspaceId: workspaceId,
                role,
                message
            }
        })
        res.json({ message: "Member added successfully.", member });

        // Add member to workspace
        await prisma.workspaceMember.create({
            data: {
                workspaceId: workspaceId,
                userId: userToAdd.id
            }
        });

        res.status(200).json({ message: "Member added successfully." });
    } catch (error) {
        console.log("Error adding member to workspace:", error);
        res.status(500).json({ message: error.code || error.message });
    }
}