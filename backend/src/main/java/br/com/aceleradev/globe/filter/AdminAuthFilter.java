package br.com.aceleradev.globe.filter;

import jakarta.annotation.Priority;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@Provider
@Priority(1)
public class AdminAuthFilter implements ContainerRequestFilter {

    @ConfigProperty(name = "admin.token")
    String adminToken;

    @Override
    public void filter(ContainerRequestContext ctx) {
        String path = ctx.getUriInfo().getPath();
        if (!path.startsWith("/api/admin") && !path.startsWith("api/admin")) return;

        String token = ctx.getHeaderString("X-Admin-Token");
        if (token == null || !adminToken.equals(token)) {
            ctx.abortWith(Response.status(401)
                    .entity("{\"error\":\"Unauthorized\"}")
                    .type("application/json")
                    .build());
        }
    }
}
