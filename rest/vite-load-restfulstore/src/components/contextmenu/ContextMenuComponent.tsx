/*
 *
 * Copyright (c) 1999-2025 Luciad All Rights Reserved.
 *
 * Luciad grants you ("Licensee") a non-exclusive, royalty free, license to use,
 * modify and redistribute this software in source and binary code form,
 * provided that i) this copyright notice and license appear on all copies of
 * the software; and ii) Licensee does not utilize the software in a manner
 * which is disparaging to Luciad.
 *
 * This software is provided "AS IS," without a warranty of any kind. ALL
 * EXPRESS OR IMPLIED CONDITIONS, REPRESENTATIONS AND WARRANTIES, INCLUDING ANY
 * IMPLIED WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE OR
 * NON-INFRINGEMENT, ARE HEREBY EXCLUDED. LUCIAD AND ITS LICENSORS SHALL NOT BE
 * LIABLE FOR ANY DAMAGES SUFFERED BY LICENSEE AS A RESULT OF USING, MODIFYING
 * OR DISTRIBUTING THE SOFTWARE OR ITS DERIVATIVES. IN NO EVENT WILL LUCIAD OR ITS
 * LICENSORS BE LIABLE FOR ANY LOST REVENUE, PROFIT OR DATA, OR FOR DIRECT,
 * INDIRECT, SPECIAL, CONSEQUENTIAL, INCIDENTAL OR PUNITIVE DAMAGES, HOWEVER
 * CAUSED AND REGARDLESS OF THE THEORY OF LIABILITY, ARISING OUT OF THE USE OF
 * OR INABILITY TO USE SOFTWARE, EVEN IF LUCIAD HAS BEEN ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGES.
 */
import {ContextMenuItem} from "@luciad/ria/view/ContextMenu.js";
import {useEffect, useRef, useState} from "react";
import {useContextMenuContext} from "ria-toolbox/libs/hooks/useContextMenu.js";
import "./ContextMenuComponent.css";

export const ContextMenuComponent = () => {
    const {contextMenu, open, x, y, hideContextMenu} = useContextMenuContext();
    const contextMenuDiv = useRef<HTMLDivElement | null>(null);
    const [size, setSize] = useState<{ width: number, height: number }>({width: 130, height: 100});

    useEffect(() => {
        if (open) {
            const hideContextMenuIfOutside = (ev: MouseEvent) => {
                if (contextMenuDiv.current) {
                    const {x, y, width, height} = contextMenuDiv.current.getBoundingClientRect();
                    const isInsideCtxMenu = ev.clientX >= x && ev.clientX <= (x + width) && ev.clientY >= y && ev.clientY <= (y + height);
                    if (!isInsideCtxMenu) {
                        hideContextMenu();
                    }
                }
            }

            document.addEventListener("mousedown", hideContextMenuIfOutside, true);
            document.addEventListener("mouseup", hideContextMenuIfOutside, true);
            document.addEventListener("wheel", hideContextMenuIfOutside, true);
            document.addEventListener("contextmenu", hideContextMenuIfOutside, true);
            document.addEventListener("click", hideContextMenuIfOutside, true);
            document.addEventListener("resize", hideContextMenu, true);

            return () => {
                document.removeEventListener("mousedown", hideContextMenuIfOutside);
                document.removeEventListener("mouseup", hideContextMenuIfOutside);
                document.removeEventListener("wheel", hideContextMenuIfOutside);
                document.removeEventListener("contextmenu", hideContextMenuIfOutside);
                document.removeEventListener("click", hideContextMenuIfOutside);
                document.removeEventListener("resize", hideContextMenu);
            }
        }

    }, [open, hideContextMenu]);

    useEffect(() => {
        if (contextMenuDiv.current) {
            const {width, height} = contextMenuDiv.current.getBoundingClientRect();
            setSize({width, height});
        }
    }, [contextMenu]);

    const {width, height} = size;
    let left = Math.max(x, 0);
    if (x > window.innerWidth - width) {
        left = x - width; // show context right-aligned to cursor
    }
    let top = Math.max(y, 0);
    if (y > window.innerHeight - height) {
        top = y - height; // show context above cursor
    }

    const renderContextMenuItem = (item: ContextMenuItem, idx: number) => {
        if (item.separator) {
            return <div className="context-menu-item separator"/>;
        }
        let checkedIcon = null;
        let icon = null;
        if (typeof item.checked !== "undefined") {
            checkedIcon = item.checked ? "✓" : "□"
        }
        if (typeof item.iconClass !== "undefined") {
            icon = <span className={`lcd-icon ${item.iconClass}`}/>
        }
        return (
            <div
                key={item.label + idx}
                className="context-menu-item"
                onClick={(event: React.MouseEvent<HTMLDivElement>) => {
                    item.action();
                    hideContextMenu();
                    event.stopPropagation(); // stop event from propagating up to body
                }}
            >
                {checkedIcon}{icon}{item.label}
            </div>
        );
    }

    if (!open || !contextMenu) {
        return null;
    }

    return (
        <div className="context-menu" style={{top, left}} ref={contextMenuDiv}>
            <span className="context-menu-title">{contextMenu.title}</span>
            {contextMenu.items.map(renderContextMenuItem)}
        </div>
    )
}
