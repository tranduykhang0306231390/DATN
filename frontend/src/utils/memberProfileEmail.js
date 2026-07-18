const GMAIL_DOMAIN = "@gmail.com";

const toInputValue = (value) => String(value ?? "");

const matchGmailAddress = (value) => (
    value.trim().match(/^([^@\s]+)@gmail\.com$/i)
);

export const getEmailEditorState = (email) => {
    const value = toInputValue(email).trim();
    const gmailMatch = matchGmailAddress(value);

    if (gmailMatch) {
        return { mode: "gmail", value: gmailMatch[1] };
    }

    if (!value) {
        return { mode: "gmail", value: "" };
    }

    return { mode: "full", value };
};

export const normalizeEmailEditorInput = (input) => {
    const value = toInputValue(input);
    const gmailMatch = matchGmailAddress(value);

    if (gmailMatch) {
        return { mode: "gmail", value: gmailMatch[1] };
    }

    if (value.includes("@")) {
        return { mode: "full", value };
    }

    return { mode: "gmail", value };
};

export const buildProfileEmail = (editor) => {
    const value = toInputValue(editor?.value).trim();

    return editor?.mode === "full"
        ? value
        : `${value}${GMAIL_DOMAIN}`;
};

export const GMAIL_EMAIL_DOMAIN = GMAIL_DOMAIN;
