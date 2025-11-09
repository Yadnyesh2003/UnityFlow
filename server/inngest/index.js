import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "unityflow" });

// Inngest function to save user data to a database
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk"},
  { event: "clerk/user.created" },
  async ({ event }) => {
    const {data} = event;
    await prisma.user.create({
      data: {
        id: data.id,
        email: data?.email_addresses[0]?.email_address || "",
        name: data?.first_name + " " + data?.last_name,
        image: data?.image_url
        // createdAt: new Date(data.created_at * 1000),
        // updatedAt: new Date(data.updated_at * 1000),
      },
    });
    console.log("User created:", userData);
  }
);

// Inngest function to delete user from database
const syncUserDeletion = inngest.createFunction(
    { id: "delete-user-with-clerk"},
    { event: "clerk/user.deleted" },
    async ({ event }) => {
        const {data} = event;
        await prisma.user.delete({
        where: {
            id: data.id,
            },
        });
    console.log("User deleted:", data.id);
    }
);

//Inngest function to update user data in database
const syncUserUpdation = inngest.createFunction(
    { id: "update-user-from-clerk"},
    { event: "clerk/user.updated" },
    async ({ event }) => {
        const {data} = event;
        await prisma.user.update({
        where: {
            id: data.id,
            },
        data: {
            email: data?.email_addresses[0]?.email_address || "",
            name: data?.first_name + " " + data?.last_name,
            image: data?.image_url
            },
        });
    console.log("User updated:", data.id);
    }
);  

// Inngest function to save Workspace data to a database
const syncWorkspaceCreation = inngest.createFunction(
    { id: "sync-workspace-from-clerk"},
    { event: "clerk/organization.created" },
    async ({ event }) => {
        const {data} = event;
        await prisma.workspace.create({
        data: {
            id: data.id,
            name: data.name,
            slug: data.slug,
            ownerId: data.created_by,
            image_url: data.image_url
            // createdAt: new Date(data.created_at * 1000),
            // updatedAt: new Date(data.updated_at * 1000),
        },
    });
    await prisma.workspaceMember.create({
        data: {
            userId: data.created_by,
            workspaceId: data.id,
            role: "ADMIN"
        }
    });
    console.log("Workspace created:", data);
    }
)

// Inngest function to update workspace data in database
const syncWorkspaceUpdation = inngest.createFunction(
    { id: "update-workspace-from-clerk"},
    { event: "clerk/organization.updated" },
    async ({ event }) => {
        const {data} = event;
        await prisma.workspace.update({
        where: {
            id: data.id,
            },
        data: {
            name: data.name,
            slug: data.slug,
            image_url: data.image_url
            },
        });
    console.log("Workspace updated:", data.id);
    }
);

// Inngest function to delete workspace from database
const syncWorkspaceDeletion = inngest.createFunction(
    { id: "delete-workspace-with-clerk"},
    { event: "clerk/organization.deleted" },
    async ({ event }) => {
        const {data} = event;
        await prisma.workspace.delete({
            where: {
                id: data.id
            }
        });
    console.log("Workspace deleted:", data.id);
    }
)

// Inngest function to save workspace member data to a database
const syncWorkspaceMemberCreation = inngest.createFunction(
    { id: "sync-workspace-member-from-clerk"},
    { event: "clerk/organizationInvitation.accepted" },
    async ({ event }) => {
        const {data} = event;
        await prisma.workspaceMember.create({
        data: {
            userId: data.user_id,
            workspaceId: data.organization_id,
            role: String(data.role_name).toUpperCase(),
            // createdAt: new Date(data.created_at * 1000),
            // updatedAt: new Date(data.updated_at * 1000),
        },
    });
    console.log("Workspace Member created:", data);
    }
)   

// Create an empty array where we'll export future Inngest functions
export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    syncWorkspaceCreation,
    syncWorkspaceUpdation,
    syncWorkspaceDeletion,
    syncWorkspaceMemberCreation
];