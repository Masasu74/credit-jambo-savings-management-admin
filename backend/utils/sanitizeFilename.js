export const sanitizeFilename = (name) => {
    return name
      .replace(/[^a-zA-Z0-9-_.]/g, '_')
      .substring(0, 100)
      .toLowerCase();
  };