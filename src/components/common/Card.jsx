import React from "react";
export default function Card({children, className=""}) { return <div className={`rounded-xl border bg-white shadow-sm ${className}`}>{children}</div>; }