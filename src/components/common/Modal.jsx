import React from "react";
export default function Modal({children, open}) { return open ? <div className="fixed inset-0 bg-black/50">{children}</div> : null; }