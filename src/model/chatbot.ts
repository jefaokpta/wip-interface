
export interface Chatbot {
    id: number;
    controlNumber: number;
    initialMessage: string;
    active: boolean;
    vipUraId: number;
    agentEmpty: string | null | undefined;
    invalidOption: string | null | undefined;
    finalMessage: string | null | undefined;
    options: chatbotOption[];
}
interface chatbotOption {
    id: number;
    option: number;
    department: string;
    departmentId: string;
}