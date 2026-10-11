import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { UserRow, UsersService } from '../../services/users.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './users-list.html',
  styleUrls: ['./users-list.scss']
})
export class UsersList implements OnInit {
  searchText = '';
  users: UserRow[] = [];

  loading = false;
  errorMessage = '';

  constructor(
    private readonly usersService: UsersService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.usersService.getUsers()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.users = res ?? [];
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Users error:', err);
          this.errorMessage = `Failed to load users. Status: ${err.status || 'error'}`;
        }
      });
  }

  openImage(url?: string): void {
    if (!url) return;
    window.open(url, '_blank');
  }

  get filteredUsers(): UserRow[] {
    const search = this.searchText.trim().toLowerCase();

    return this.users.filter(user => {
      const name = user.name ?? '';
      const email = user.email ?? '';
      const employeeId = user.employeeId ?? '';
      const userDomain = user.userDomain ?? '';
      const department = user.department ?? '';
      const title = user.title ?? '';
      const role = user.role ?? '';

      return (
        !search ||
        name.toLowerCase().includes(search) ||
        email.toLowerCase().includes(search) ||
        employeeId.toLowerCase().includes(search) ||
        userDomain.toLowerCase().includes(search) ||
        department.toLowerCase().includes(search) ||
        title.toLowerCase().includes(search) ||
        role.toLowerCase().includes(search)
      );
    });
  }
}